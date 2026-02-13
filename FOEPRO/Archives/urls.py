from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'cart', views.CartViewSet, basename='cart')

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
    path('signup/', views.signup, name='signup'),
    path('signin/', views.signin, name='signin'),
    path('logout/', views.logout, name='logout'),
    path('product/<slug:slug>/', views.product_detail, name='product_detail'),
    
    # API endpoints
    path('api/check-username/', views.check_username, name='check_username'),
    path('api/signin/', views.api_signin, name='api_signin'),
    path('api/signup/', views.api_signup, name='api_signup'),
    path('api/verify-otp/', views.verify_otp, name='verify_otp'),
    path('api/resend-otp/', views.api_resend_otp, name='api_resend_otp'),
    path('api/email-status/', views.email_status, name='email_status'),
    
    # E-commerce API
    path('api/', include(router.urls)),
]