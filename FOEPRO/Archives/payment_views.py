import logging
from decimal import Decimal

from django.conf import settings
from django.db import transaction
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
        # Reserve stock
        for item in cart_items:
            Product.objects.filter(id=item['product'].id).update(
                stock=item['product'].stock - item['quantity']
            )

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
    razorpay_order_id = request.data.get('razorpay_order_id', '').strip()
    razorpay_payment_id = request.data.get('razorpay_payment_id', '').strip()
    razorpay_signature = request.data.get('razorpay_signature', '').strip()

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature]):
        return Response({'error': 'Missing payment details'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(razorpay_order_id=razorpay_order_id, user=request.user)
    except Order.DoesNotExist:
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

        return Response({
            'status': 'success',
            'order_id': order.order_id,
        })
    else:
        # Signature verification failed - restore stock
        with transaction.atomic():
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = 'failed'
            payment.save()

            order.status = 'failed'
            order.save(update_fields=['status', 'updated_at'])

            # Restore stock
            for item in order.items.select_related('product'):
                Product.objects.filter(id=item.product_id).update(
                    stock=item.product.stock + item.quantity
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
        for item in order.items.select_related('product'):
            Product.objects.filter(id=item.product_id).update(
                stock=item.product.stock + item.quantity
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
