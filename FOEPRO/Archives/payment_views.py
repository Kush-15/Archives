import hashlib
import hmac
import json
import logging
import stripe
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Address, Order, OrderItem, Payment, Product
from .serializers import AddressSerializer, OrderSerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_stripe_key(request):
    """Return the Stripe publishable key for the frontend checkout."""
    if not settings.STRIPE_PUBLISHABLE_KEY:
        return Response({'error': 'Stripe not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({'publishable_key': settings.STRIPE_PUBLISHABLE_KEY})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_address(request):
    """Create a new saved address."""
    serializer = AddressSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(user=request.user)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_addresses(request):
    """List all saved addresses for the current user."""
    addresses = Address.objects.filter(user=request.user)
    serializer = AddressSerializer(addresses, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_order(request):
    """Accept cart items from frontend, validate stock, create Order + OrderItems, create Stripe payment intent."""
    address_id = request.data.get('address_id')
    if not address_id:
        return Response({'error': 'address_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    # items from frontend: [{product_id: 'slug', quantity: 1}, ...]
    items_data = request.data.get('items', [])
    if not items_data:
        return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        address = Address.objects.get(id=address_id, user=request.user)
    except Address.DoesNotExist:
        return Response({'error': 'Address not found'}, status=status.HTTP_404_NOT_FOUND)

    # Look up products by slug (frontend product.id = backend product.slug)
    product_slugs = [item.get('product_id') for item in items_data if item.get('product_id')]
    products = {p.slug: p for p in Product.objects.filter(slug__in=product_slugs)}

    # Build cart items list
    cart_items = []
    for item in items_data:
        slug = item.get('product_id')
        qty = int(item.get('quantity', 1))
        product = products.get(slug)
        if not product:
            return Response({'error': f'Product not found: {slug}'}, status=status.HTTP_404_NOT_FOUND)
        cart_items.append({'product': product, 'quantity': qty})

    # Validate stock for every item
    stock_errors = []
    for item in cart_items:
        if item['quantity'] > item['product'].stock:
            stock_errors.append({
                'product_id': item['product'].id,
                'product_name': item['product'].name,
                'requested': item['quantity'],
                'available': item['product'].stock,
            })
    if stock_errors:
        return Response({
            'error': 'Insufficient stock',
            'details': stock_errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    # Calculate total
    total = sum(item['product'].price * item['quantity'] for item in cart_items)
    total_paise = int(total * 100)

    with transaction.atomic():
        # Reserve stock (atomic F() expression to prevent race conditions)
        for item in cart_items:
            updated = Product.objects.filter(
                id=item['product'].id, stock__gte=item['quantity']
            ).update(stock=F('stock') - item['quantity'])
            if not updated:
                return Response({
                    'error': f"Insufficient stock for {item['product'].name}",
                }, status=status.HTTP_400_BAD_REQUEST)

        # Create Order
        order = Order.objects.create(
            user=request.user,
            address=address,
            total_amount=total,
            status='pending',
        )

        # Create OrderItems
        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item['product'],
                product_name=item['product'].name,
                product_price=item['product'].price,
                quantity=item['quantity'],
            )

        # Create Stripe PaymentIntent
        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            intent = stripe.PaymentIntent.create(
                amount=total_paise,
                currency='inr',
                metadata={'order_id': order.order_id}
            )
            order.stripe_payment_intent_id = intent.id
            order.save(update_fields=['stripe_payment_intent_id'])
            
            # Create Payment record (pending)
            Payment.objects.create(order=order, status='pending')

            return Response({
                'order_id': order.order_id,
                'clientSecret': intent.client_secret,
                'amount': total_paise,
                'currency': 'inr',
            }, status=status.HTTP_201_CREATED)
            
        except stripe.error.StripeError as e:
            return Response({'error': str(e.user_message)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_payment(request):
    """Verify Stripe PaymentIntent. On success: mark paid, clear cart. On failure: restore stock."""
    stripe.api_key = settings.STRIPE_SECRET_KEY
    payment_intent_id = (request.data.get('payment_intent_id') or '').strip()

    logger.info('verify_payment called: payment_intent_id=%s', payment_intent_id)

    if not payment_intent_id:
        return Response({'error': 'Missing payment_intent_id'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
    except stripe.error.StripeError as e:
        logger.error('verify_payment: StripeError - %s', str(e))
        return Response({'error': 'Invalid payment intent'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(stripe_payment_intent_id=payment_intent_id, user=request.user)
    except Order.DoesNotExist:
        logger.error('verify_payment: Order not found for payment_intent_id=%s', payment_intent_id)
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    payment = order.payment

    if intent.status == 'succeeded':
        with transaction.atomic():
            payment.status = 'success'
            payment.save()

            order.status = 'paid'
            order.save(update_fields=['status', 'updated_at'])

        logger.info('verify_payment: SUCCESS for order %s', order.order_id)
        return Response({
            'status': 'success',
            'order_id': order.order_id,
        })
    else:
        # Verification failed
        logger.error('verify_payment: PAYMENT NOT SUCCEEDED for order %s - Status: %s', order.order_id, intent.status)
        with transaction.atomic():
            payment.status = 'failed'
            payment.save()

            order.status = 'failed'
            order.save(update_fields=['status', 'updated_at'])

            # Restore stock
            for item in order.items.all():
                Product.objects.filter(id=item.product_id).update(
                    stock=F('stock') + item.quantity
                )

        return Response({
            'status': 'failed',
            'order_id': order.order_id,
            'error': 'Payment verification failed',
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_order(request):
    """Cancel a pending order and restore stock."""
    order_id = request.data.get('order_id', '').strip()
    if not order_id:
        return Response({'error': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(order_id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.status != 'pending':
        return Response({'error': 'Only pending orders can be cancelled'}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        order.status = 'cancelled'
        order.save(update_fields=['status', 'updated_at'])

        payment = order.payment
        payment.status = 'failed'
        payment.save(update_fields=['status', 'updated_at'])

        # Restore stock
        for item in order.items.all():
            Product.objects.filter(id=item.product_id).update(
                stock=F('stock') + item.quantity
            )

    return Response({'status': 'cancelled', 'order_id': order.order_id})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_orders(request):
    """List all orders for the current user."""
    orders = Order.objects.filter(user=request.user).prefetch_related('items', 'payment')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_detail(request, order_id):
    """Get details of a specific order."""
    try:
        order = Order.objects.prefetch_related('items', 'payment').get(
            order_id=order_id, user=request.user
        )
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = OrderSerializer(order)
    return Response(serializer.data)


@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def stripe_webhook(request):
    """Handle Stripe webhook events for payment status updates.

    This is a server-side fallback for payment verification.
    Set the webhook secret in settings.STRIPE_WEBHOOK_SECRET.
    """
    import stripe
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')

    try:
        if webhook_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        else: # Fallback purely for testing
            event = json.loads(payload)
    except ValueError:
        return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        intent_id = payment_intent['id']
        try:
            order = Order.objects.get(stripe_payment_intent_id=intent_id)
            if order.status != 'paid':
                with transaction.atomic():
                    order.payment.status = 'success'
                    order.payment.save()
                    order.status = 'paid'
                    order.save(update_fields=['status', 'updated_at'])
                logger.info(f"Webhook: Payment captured for order {order.order_id}")
        except Order.DoesNotExist:
            logger.warning(f"Webhook: Order not found for intent {intent_id}")

    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        intent_id = payment_intent['id']
        try:
            order = Order.objects.get(stripe_payment_intent_id=intent_id)
            if order.status not in ('paid', 'failed', 'cancelled'):
                with transaction.atomic():
                    order.payment.status = 'failed'
                    order.payment.save()
                    order.status = 'failed'
                    order.save(update_fields=['status', 'updated_at'])
                    # Restore stock
                    for item in order.items.all():
                        Product.objects.filter(id=item.product_id).update(
                            stock=F('stock') + item.quantity
                        )
                logger.info(f"Webhook: Payment failed for order {order.order_id}, stock restored")
        except Order.DoesNotExist:
            logger.warning(f"Webhook: Order not found for failed intent {intent_id}")

    return Response({'status': 'ok'}, status=status.HTTP_200_OK)
