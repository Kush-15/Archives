from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login, logout as django_logout
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.templatetags.static import static
from django.template import TemplateDoesNotExist
from django.db import DatabaseError
from .models import User, Product
from .forms import UserSignUpForm, UserSignInForm
import json
import random
import string
import logging
import smtplib
import os

logger = logging.getLogger(__name__)


def _get_auth_backend():
    backends = getattr(settings, 'AUTHENTICATION_BACKENDS', None)
    if backends:
        return backends[0]
    return 'django.contrib.auth.backends.ModelBackend'

# Serve the frontend using Django's template engine (so template tags like {% static %} are resolved)
def _serve_spa(request):
    """Render the single canonical `index.html` template using Django's template engine.
    This ensures `{% load static %}` and `{% static ... %}` are processed correctly.
    """
    try:
        return render(request, 'index.html')
    except TemplateDoesNotExist:
        logger.warning("SPA template 'index.html' not found; ensure the frontend is built and copied to Archives/static and Archives/templates.")
        return HttpResponse("Frontend not built yet. Run 'npm run build' in the frontend directory.", status=503)

# Create your views here.
def home(request):
    return _serve_spa(request)

def signup(request):
    """Render the single-page frontend for signup (SPA handles UI)"""
    return _serve_spa(request)

def signin(request):
    """Render the single-page frontend for signin (SPA handles UI)"""
    return _serve_spa(request)

def about(request):
    # SPA handles routing and static pages
    return _serve_spa(request)

def contact(request):
    # SPA handles routing and static pages
    return _serve_spa(request)

def product_detail(request, slug):
    product = get_object_or_404(Product, slug=slug)

    accept = request.headers.get('Accept', '')
    wants_json = 'application/json' in accept or request.GET.get('format') == 'json'
    if wants_json:
        return JsonResponse({
            'id': product.id,
            'name': product.name,
            'slug': product.slug,
            'description': product.description,
            'price': str(product.price),
            'stock': product.stock,
            'rating_avg': float(product.rating_avg),
            'rating_count': product.rating_count,
            'category': {
                'id': product.category_id,
                'name': product.category.name,
                'slug': product.category.slug,
            },
            'created_at': product.created_at,
            'updated_at': product.updated_at,
        })

    try:
        return render(request, 'product_detail.html', {'product': product})
    except TemplateDoesNotExist:
        return _serve_spa(request)

def sign(request):
    """Handle both sign-in and sign-up"""
    if request.method == 'POST':
        # Check if this is a sign-in or sign-up request
        action = request.POST.get('action', 'signin')
        
        if action == 'signup':
            form = UserSignUpForm(request.POST)
            if form.is_valid():
                user = form.save()

                # Generate OTP and record timestamp so data is stored in DB
                otp = ''.join(random.choices(string.digits, k=6))
                user.otp = otp
                user.otp_created_at = timezone.now()
                user.save()

                # Try to send OTP email, but do not delete user if email fails
                if not settings.EMAIL_HOST_PASSWORD or not settings.EMAIL_HOST_USER:
                    logger.warning('EMAIL_HOST_USER or EMAIL_HOST_PASSWORD missing; cannot send OTP for %s', user.email)
                    return JsonResponse({
                        'status': 'warning',
                        'message': 'Registration successful, but email sending is not configured. OTP generated but not sent.',
                        'redirect': '/sign/'
                    })

                try:
                    send_mail(
                        subject='Your OTP for The Archives',
                        message=f'Your One-Time Password (OTP) is: {otp}\n\nThis OTP will expire in 10 minutes.\n\nDo not share this OTP with anyone.',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                        auth_user=settings.EMAIL_HOST_USER,
                        auth_password=settings.EMAIL_HOST_PASSWORD,
                    )
                except Exception:
                    logger.exception('Failed to send OTP to %s', user.email)
                    return JsonResponse({
                        'status': 'warning',
                        'message': 'Registration successful, but OTP email failed to send. Please try resending the OTP.',
                        'redirect': '/sign/'
                    })

                return JsonResponse({
                    'status': 'success',
                    'message': 'Registration successful! OTP sent to your email.',
                    'redirect': '/sign/'
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'errors': form.errors
                }, status=400)
        
        else:  # signin
            form = UserSignInForm(request.POST)
            if form.is_valid():
                username = form.cleaned_data['username']
                user = User.objects.get(username=username)
                
                # Use Django auth login to update last_login
                login(request, user, backend=_get_auth_backend())
                
                return JsonResponse({
                    'status': 'success',
                    'message': f'Welcome back, {user.username}!',
                    'redirect': '/'
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'errors': form.errors
                }, status=400)
    
    else:  # GET request
        return render(request, 'Archives/sign.html')


@csrf_exempt
@require_http_methods(["POST"])
def check_username(request):
    """API endpoint to check if username is available"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        
        if not username:
            return JsonResponse({
                'available': False,
                'message': 'Username is required'
            })
        
        # Check if username already exists
        exists = User.objects.filter(username=username).exists()
        
        return JsonResponse({
            'available': not exists,
            'message': 'Username is available' if not exists else 'Username already taken'
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'available': False,
            'message': 'Invalid JSON'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'available': False,
            'message': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_signin(request):
    """API endpoint for sign-in via AJAX"""
    try:
        data = json.loads(request.body)
        email = (data.get('email') or '').strip().lower()
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({
                'status': 'error',
                'message': 'Email and password are required'
            }, status=400)
        
        try:
            user = User.objects.get(email__iexact=email)
            if user.verify_password(password):
                if user.is_active:
                    # Use Django auth login to update last_login
                    login(request, user, backend=_get_auth_backend())
                    return JsonResponse({
                        'status': 'success',
                        'message': f'Welcome back, {user.username}!',
                        'user': {
                            'id': user.id,
                            'username': user.username,
                            'email': user.email
                        }
                    })
                else:
                    return JsonResponse({
                        'status': 'error',
                        'message': 'Account is inactive'
                    }, status=403)
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid email or password'
                }, status=401)
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid email or password'
            }, status=401)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON'
        }, status=400)
    except DatabaseError:
        # Convert DB failures into a stable API contract so frontend can show a meaningful message.
        logger.exception('Database error during signin')
        return JsonResponse({
            'status': 'error',
            'message': 'Service unavailable. Please try again later.',
            'error': 'service_unavailable',
            'detail': 'database error'
        }, status=503)
    except Exception:
        # Fallback to avoid exposing tracebacks to end users.
        logger.exception('Unhandled exception in signin')
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error',
            'error': 'internal_error'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_signup(request):
    """API endpoint for sign-up via AJAX"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        username = data.get('username', '').strip()
        email = data.get('email', '').strip().lower()
        phone = data.get('phone', '').strip()
        password = data.get('password', '')
        
        if not all([username, email, phone, password]):
            return JsonResponse({
                'status': 'error',
                'message': 'All fields are required'
            }, status=400)
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Username already taken'
            }, status=400)
        
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Email already registered'
            }, status=400)
        
        if User.objects.filter(phone=phone).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Phone number already registered'
            }, status=400)
        
        # Validate password length
        if len(password) < 6:
            return JsonResponse({
                'status': 'error',
                'message': 'Password must be at least 6 characters'
            }, status=400)
        
        # Create user (not verified yet)
        user = User(username=username, email=email, phone=phone, is_verified=False)
        user.set_password(password)
        
        # Generate OTP
        otp = ''.join(random.choices(string.digits, k=6))
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()
        
        # Send OTP via email
        # Ensure credentials are available to authenticate with SMTP
        if not settings.EMAIL_HOST_PASSWORD or not settings.EMAIL_HOST_USER:
            # Keep the user record so they can retry; don't delete it
            logger.warning('EMAIL_HOST_USER or EMAIL_HOST_PASSWORD missing; cannot send OTP for %s', email)
            return JsonResponse({
                'status': 'error',
                'message': 'Email sending not configured. Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in environment.'
            }, status=500)

        try:
            send_mail(
                subject='Your OTP for The Archives',
                message=f'Your One-Time Password (OTP) is: {otp}\n\nThis OTP will expire in 10 minutes.\n\nDo not share this OTP with anyone.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
                auth_user=settings.EMAIL_HOST_USER,
                auth_password=settings.EMAIL_HOST_PASSWORD,
            )
        except Exception as e:
            # Log the exception for debugging, keep the user to allow resend
            logger.exception('Failed to send OTP to %s', email)
            return JsonResponse({
                'status': 'error',
                'message': 'Failed to send OTP. Please try resending the OTP later.'
            }, status=500)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Account created! OTP sent to your email.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON'
        }, status=400)
    except Exception as e:
        logger.exception('Unhandled exception in api_signup')
        return JsonResponse({
            'status': 'error',
            'message': 'Internal server error'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def api_resend_otp(request):
    """API endpoint to resend OTP to an unverified user"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        if not email:
            return JsonResponse({'status': 'error', 'message': 'Email is required'}, status=400)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'User not found'}, status=404)

        if user.is_verified:
            return JsonResponse({'status': 'error', 'message': 'User already verified'}, status=400)

        # Generate new OTP
        otp = ''.join(random.choices(string.digits, k=6))
        user.otp = otp
        user.otp_created_at = timezone.now()
        user.save()

        # Ensure credentials are available
        if not settings.EMAIL_HOST_PASSWORD or not settings.EMAIL_HOST_USER:
            logger.warning('EMAIL_HOST_USER or EMAIL_HOST_PASSWORD missing; cannot send OTP for %s', email)
            return JsonResponse({'status': 'error', 'message': 'Email sending not configured. Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in environment.'}, status=500)

        try:
            send_mail(
                subject='Your OTP for The Archives',
                message=f'Your One-Time Password (OTP) is: {otp}\n\nThis OTP will expire in 10 minutes.\n\nDo not share this OTP with anyone.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
                auth_user=settings.EMAIL_HOST_USER,
                auth_password=settings.EMAIL_HOST_PASSWORD,
            )
        except Exception:
            logger.exception('Failed to resend OTP to %s', email)
            return JsonResponse({'status': 'error', 'message': 'Failed to send OTP. Please try again later.'}, status=500)

        return JsonResponse({'status': 'success', 'message': 'OTP resent to your email.'})

    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    except Exception as e:
        logger.exception('Unhandled error in api_resend_otp')
        return JsonResponse({'status': 'error', 'message': 'Internal server error'}, status=500)


@require_http_methods(["GET"])
def email_status(request):
    """Return whether email credentials are configured and whether SMTP login works."""
    configured = bool(settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD)
    result = {'configured': configured}
    if not configured:
        result['message'] = 'EMAIL_HOST_USER or EMAIL_HOST_PASSWORD is not set'
        return JsonResponse(result)

    # Try SMTP login (no message sent)
    try:
        with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10) as smtp:
            if settings.EMAIL_USE_TLS:
                smtp.starttls()
            smtp.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        result['login_ok'] = True
    except Exception as e:
        logger.exception('SMTP login test failed')
        result['login_ok'] = False
        result['error'] = str(e)

    return JsonResponse(result)


def logout(request):
    """Logout user"""
    django_logout(request)
    return redirect('home')


@csrf_exempt
@require_http_methods(["POST"])
def verify_otp(request):
    """API endpoint to verify OTP"""
    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip()
        otp = data.get('otp', '').strip()
        
        if not email or not otp:
            return JsonResponse({
                'status': 'error',
                'message': 'Email and OTP are required'
            }, status=400)
        
        try:
            user = User.objects.get(email=email)
            
            # Check if OTP is valid
            if not user.is_otp_valid():
                return JsonResponse({
                    'status': 'error',
                    'message': 'OTP has expired. Please sign up again.'
                }, status=400)
            
            # Verify OTP
            if user.otp != otp:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Invalid OTP. Please try again.'
                }, status=400)
            
            # Mark user as verified
            user.is_verified = True
            user.otp = None
            user.otp_created_at = None
            user.save()
            
            # Use Django auth login to update last_login
            login(request, user, backend=_get_auth_backend())
            
            return JsonResponse({
                'status': 'success',
                'message': 'Email verified successfully!',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            })
        
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'User not found'
            }, status=404)
    
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


# E-commerce API Views
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Category, Product, Cart, CartItem, ProductRating
from .serializers import CategorySerializer, ProductSerializer, CartSerializer, CartItemSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('-created_at')
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can create categories'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can update categories'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can delete categories'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can add products'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can update products'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can delete products'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        product = self.get_object()
        rating = request.data.get('rating')

        try:
            rating_value = int(rating)
        except (TypeError, ValueError):
            return Response({'error': 'Rating must be an integer between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)

        if rating_value < 1 or rating_value > 5:
            return Response({'error': 'Rating must be between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)

        ProductRating.objects.update_or_create(
            product=product,
            user=request.user,
            defaults={'rating': rating_value}
        )
        product.update_rating_stats()

        return Response({
            'product_id': product.id,
            'rating_avg': float(product.rating_avg),
            'rating_count': product.rating_count,
            'user_rating': rating_value,
        }, status=status.HTTP_200_OK)


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        cart = self.get_object()
        items = cart.items.all()
        serializer = CartItemSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        cart = self.get_object()
        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if quantity > product.stock:
            return Response({
                'error': f'Only {product.stock} items available in stock',
                'available_stock': product.stock
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            new_quantity = cart_item.quantity + quantity
            if new_quantity > product.stock:
                return Response({
                    'error': f'Cannot add {quantity} more. Only {product.stock - cart_item.quantity} more available',
                    'available_stock': product.stock - cart_item.quantity,
                    'current_in_cart': cart_item.quantity
                }, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = new_quantity
            cart_item.save()
        
        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def remove_item(self, request, pk=None):
        cart = self.get_object()
        product_id = request.data.get('product')
        
        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
            cart_item.delete()
            return Response({'message': 'Item removed'}, status=status.HTTP_200_OK)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def update_item(self, request, pk=None):
        cart = self.get_object()
        product_id = request.data.get('product')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if quantity <= 0:
            cart_item.delete()
            return Response({'message': 'Item removed'}, status=status.HTTP_200_OK)
        
        if quantity > cart_item.product.stock:
            return Response({
                'error': f'Only {cart_item.product.stock} items available in stock',
                'available_stock': cart_item.product.stock
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart_item.quantity = quantity
        cart_item.save()
        
        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'])
    def clear(self, request, pk=None):
        cart = self.get_object()
        cart.items.all().delete()
        return Response({'message': 'Cart cleared'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def validate_stock(self, request, pk=None):
        cart = self.get_object()
        errors = []
        for item in cart.items.all():
            if item.quantity > item.product.stock:
                errors.append({
                    'product_id': item.product.id,
                    'product_name': item.product.name,
                    'requested': item.quantity,
                    'available': item.product.stock
                })
        if errors:
            return Response({
                'valid': False,
                'message': 'Some items exceed available stock',
                'errors': errors
            }, status=status.HTTP_400_BAD_REQUEST)
        return Response({'valid': True, 'message': 'All items are available'})