import hashlib
import hmac
import json
import logging
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
from .services.razorpay_service import create_order as rzp_create_order, verify_payment_signature

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_razorpay_key(request):
    """Return the Razorpay key_id for the frontend checkout modal."""
    if not settings.RAZORPAY_KEY_ID:
        return Response({'error': 'Razorpay not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({'key_id': settings.RAZORPAY_KEY_ID})


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
    """Accept cart items from frontend, validate stock, create Order + OrderItems, create Razorpay order."""
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

        # Create Razorpay order
        rzp_order = rzp_create_order(
            amount_in_paise=total_paise,
            receipt=order.order_id,
        )
        order.razorpay_order_id = rzp_order['id']
        order.save(update_fields=['razorpay_order_id'])

        # Create Payment record (pending)
        Payment.objects.create(order=order, status='pending')

    return Response({
        'order_id': order.order_id,
        'razorpay_order_id': rzp_order['id'],
        'amount': total_paise,
        'currency': rzp_order.get('currency', 'INR'),
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def verify_payment(request):
    """Verify Razorpay payment signature. On success: mark paid, clear cart. On failure: restore stock."""
    razorpay_order_id = (request.data.get('razorpay_order_id') or '').strip()
    razorpay_payment_id = (request.data.get('razorpay_payment_id') or '').strip()
    razorpay_signature = (request.data.get('razorpay_signature') or '').strip()

    logger.info('verify_payment called: order_id=%s, payment_id=%s, sig_len=%s',
                razorpay_order_id, razorpay_payment_id, len(razorpay_signature))

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        logger.warning('verify_payment: missing payment details - order_id=%s, payment_id=%s, sig=%s',
                       bool(razorpay_order_id), bool(razorpay_payment_id), bool(razorpay_signature))
        return Response({'error': 'Missing payment details'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(razorpay_order_id=razorpay_order_id, user=request.user)
    except Order.DoesNotExist:
        logger.error('verify_payment: Order not found for razorpay_order_id=%s, user=%s',
                     razorpay_order_id, request.user)
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    payment = order.payment

    if verify_payment_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
        with transaction.atomic():
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
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
        # Signature verification failed - restore stock
        logger.error('verify_payment: SIGNATURE FAILED for order %s', order.order_id)
        with transaction.atomic():
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
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
def razorpay_webhook(request):
    """Handle Razorpay webhook events for payment status updates.

    This is a server-side fallback for payment verification.
    Set the webhook secret in settings.RAZORPAY_WEBHOOK_SECRET.
    """
    # Verify webhook signature
    webhook_secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', '')
    if webhook_secret:
        signature = request.META.get('HTTP_X_RAZORPAY_SIGNATURE', '')
        body = request.body
        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected_signature):
            logger.warning('Invalid Razorpay webhook signature')
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

    event = payload.get('event', '')
    payment_entity = payload.get('payload', {}).get('payment', {}).get('entity', {})

    if not payment_entity:
        return Response({'status': 'ignored'}, status=status.HTTP_200_OK)

    razorpay_order_id = payment_entity.get('order_id', '')
    razorpay_payment_id = payment_entity.get('id', '')
    payment_status = payment_entity.get('status', '')

    if not razorpay_order_id:
        return Response({'status': 'ignored'}, status=status.HTTP_200_OK)

    try:
        order = Order.objects.get(razorpay_order_id=razorpay_order_id)
    except Order.DoesNotExist:
        logger.warning('Webhook: Order not found for razorpay_order_id=%s', razorpay_order_id)
        return Response({'status': 'order not found'}, status=status.HTTP_200_OK)

    # Skip if already processed
    if order.status in ('paid', 'failed', 'cancelled'):
        return Response({'status': 'already processed'}, status=status.HTTP_200_OK)

    payment = order.payment

    if event == 'payment.captured' and payment_status == 'captured':
        with transaction.atomic():
            payment.razorpay_payment_id = razorpay_payment_id
            payment.status = 'success'
            payment.save()
            order.status = 'paid'
            order.save(update_fields=['status', 'updated_at'])
        logger.info('Webhook: Payment captured for order %s', order.order_id)

    elif event == 'payment.failed' or payment_status == 'failed':
        with transaction.atomic():
            payment.razorpay_payment_id = razorpay_payment_id
            payment.status = 'failed'
            payment.save()
            order.status = 'failed'
            order.save(update_fields=['status', 'updated_at'])
            # Restore stock
            for item in order.items.all():
                Product.objects.filter(id=item.product_id).update(
                    stock=F('stock') + item.quantity
                )
        logger.info('Webhook: Payment failed for order %s, stock restored', order.order_id)

    return Response({'status': 'ok'}, status=status.HTTP_200_OK)
