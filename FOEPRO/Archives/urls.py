from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from . import views
from .views import api_logout
from .google_oauth import google_auth_start, google_auth_callback, google_auth_exchange
from . import payment_views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'cart', views.CartViewSet, basename='cart')

urlpatterns = [
    path('', views.home, name='home'),
    path('catalog/', views.home, name='catalog_spa'),
    path('profile/', views.home, name='profile_spa'),
    path('checkout/', views.home, name='checkout_spa'),
    path('order-confirmation/', views.home, name='order_confirmation_spa'),
    path('orders/', views.home, name='orders_spa'),
    path('orders/<str:order_id>/', views.home, name='order_detail_spa'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('signup/', views.signup, name='signup'),
    path('signin/', views.signin, name='signin'),
    path('logout/', views.logout, name='logout'),
    path('product/<slug:slug>/', views.product_detail, name='product_detail'),
    
    # API endpoints
    path('api/check-username/', views.check_username, name='check_username'),
    path('api/link-product/', views.api_link_product, name='api_link_product'),
    path('api/signin/', views.api_signin, name='api_signin'),
    path('api/signup/', views.api_signup, name='api_signup'),
    path('api/verify-otp/', views.verify_otp, name='verify_otp'),
    path('api/resend-otp/', views.api_resend_otp, name='api_resend_otp'),
    path('api/email-status/', views.email_status, name='email_status'),
    path('api/logout/', api_logout, name='api_logout'),
    
    # Google OAuth 2.0
    path('api/auth/google/login/', google_auth_start, name='google_auth_login'),
    path('api/auth/google/start/', google_auth_start, name='google_auth_start'),
    path('api/auth/callback/', google_auth_callback, name='google_auth_callback'),
    path('api/auth/google/exchange/', google_auth_exchange, name='google_auth_exchange'),
    
    # E-commerce API
    path('api/', include(router.urls)),

    # Payment & Orders
    path('api/payment/webhook/', payment_views.stripe_webhook, name='payment_webhook'),
    path('api/payment/key/', payment_views.get_stripe_key, name='payment_key'),
    path('api/payment/create-order/', payment_views.create_order, name='payment_create_order'),
    path('api/payment/verify/', payment_views.verify_payment, name='payment_verify'),
    path('api/orders/cancel/', payment_views.cancel_order, name='order_cancel'),
    path('api/orders/', payment_views.list_orders, name='order_list'),
    path('api/orders/<str:order_id>/', payment_views.order_detail, name='order_detail'),
    path('api/addresses/', payment_views.list_addresses, name='address_list'),
    path('api/addresses/create/', payment_views.create_address, name='address_create'),

    # SPA fallback: keep this last so API/admin/static/media are not intercepted.
    re_path(r'^(?!api/|admin/|static/|media/).*$' , views.home, name='spa_fallback'),
]