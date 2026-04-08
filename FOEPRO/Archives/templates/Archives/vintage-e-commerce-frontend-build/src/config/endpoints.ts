/**
 * Centralized API endpoint constants.
 * Single source of truth — makes refactoring and auditing safer.
 */

// ── Authentication ──
export const API_SIGNIN = '/api/signin/';
export const API_SIGNUP = '/api/signup/';
export const API_VERIFY_OTP = '/api/verify-otp/';
export const API_RESEND_OTP = '/api/resend-otp/';
export const API_LOGOUT = '/api/logout/';
export const API_CHECK_USERNAME = '/api/check-username/';

// ── Google OAuth ──
export const API_GOOGLE_LOGIN = '/api/auth/google/login/';
export const API_GOOGLE_EXCHANGE = '/api/auth/google/exchange/';

// ── Products ──
export const API_PRODUCTS = '/api/products/';
export const apiProductDetail = (id: string) => `/product/${id}/?format=json`;
export const apiProductsBySlug = (slug: string) => `/api/products/?slug=${encodeURIComponent(slug)}`;
export const apiProductReviews = (productId: number) => `/api/products/${productId}/reviews/`;
export const apiProductRate = (productId: number) => `/api/products/${productId}/rate/`;
export const API_LINK_PRODUCT = '/api/link-product/';

// ── Addresses ──
export const API_ADDRESSES = '/api/addresses/';
export const API_ADDRESSES_CREATE = '/api/addresses/create/';

// ── Payments ──
export const API_PAYMENT_KEY = '/api/payment/key/';
export const API_PAYMENT_CREATE_ORDER = '/api/payment/create-order/';
export const API_PAYMENT_VERIFY = '/api/payment/verify/';
