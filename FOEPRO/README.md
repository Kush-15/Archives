# The Archives

Full-stack vintage e-commerce application with a Django + DRF backend and a React (Vite) SPA frontend.

## Stack

- **Backend:** Django 5.2, Django REST Framework, token auth, Google OAuth 2.0, Stripe
- **Frontend:** React 19, Vite 7, TypeScript, Tailwind
- **Database:** SQLite (local default) or Postgres (via `DATABASE_URL` / `DB_*`)
- **Deployment:** Vercel (custom build output via `build.sh`)

## Repository layout

```text
FOEPRO/
├── Archives/                                   # Main Django app
│   ├── models.py                               # Users, products, cart, orders, payments
│   ├── views.py                                # Auth, OTP, SPA serving, API endpoints
│   ├── google_oauth.py                         # Google OAuth login/callback/exchange
│   ├── payment_views.py                        # Stripe + order flow
│   ├── serializers.py                          # DRF serializers
│   ├── tests/test_google_auth.py               # OAuth backend tests
│   └── templates/Archives/vintage-e-commerce-frontend-build/
│       ├── src/                                # React SPA source
│       ├── tests/                              # Frontend unit/e2e tests
│       └── package.json
├── FOEPRO/                                     # Django project settings/urls/wsgi
├── api/index.py                                # Vercel serverless entrypoint (WSGI)
├── core/views_health.py                        # /api/health
├── build.sh                                    # Frontend build + collectstatic + Vercel routes
├── requirements.txt
└── package.json                                # Root build script wrapper
```

## Core capabilities

- Email/password auth with OTP verification (`/api/signup/`, `/api/verify-otp/`, `/api/signin/`)
- Google OAuth 2.0 flow:
  - `GET /api/auth/google/login/`
  - `GET /api/auth/google/callback/`
  - `POST /api/auth/google/exchange/`
- Token-based API auth (`rest_framework.authtoken`)
- Category/product catalog APIs
- Product ratings and reviews
- Cart management APIs
- Address, order, Stripe payment, webhook, and order history APIs
- SPA routes for home/catalog/profile/checkout/orders and OAuth callback

## Local development

### 1) Backend (Django)

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Windows convenience script:

```bash
run.bat
```

### 2) Frontend (Vite)

```bash
cd Archives\templates\Archives\vintage-e-commerce-frontend-build
npm install
npm run dev
```

- Vite runs on `http://127.0.0.1:3000`
- Django runs on `http://127.0.0.1:8000`

## Environment variables

### Backend (`.env`)

Important keys used by settings:

- `DEBUG`, `SECRET_KEY`
- `DATABASE_URL` (or `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`)
- `USE_REMOTE_DB`, `RUNSERVER_REMOTE_DB`, `RUNSERVER_DB_PROBE_TIMEOUT`
- `ALLOWED_HOSTS_CSV`, `CSRF_TRUSTED_ORIGINS_CSV`
- `BACKEND_BASE_URL`, `FRONTEND_BASE_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

### Frontend (`.env` in SPA folder)

- `VITE_BACKEND_BASE_URL` (set to `http://127.0.0.1:8000` for local dev)

## Google OAuth (current behavior)

- Credentials are sourced from:
  1. `GOOGLE_CREDENTIALS_FILE` (only when explicitly set), otherwise
  2. `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- Redirect URI must match exactly between:
  - `GOOGLE_REDIRECT_URI`
  - Google Cloud Console OAuth client config

For Vercel custom domain deployment:

- `BACKEND_BASE_URL=https://thearchives-chi.vercel.app`
- `FRONTEND_BASE_URL=https://thearchives-chi.vercel.app`
- `GOOGLE_REDIRECT_URI=https://thearchives-chi.vercel.app/api/auth/google/callback/`

## API overview

Key groups:

- **Auth:** `/api/signin/`, `/api/signup/`, `/api/verify-otp/`, `/api/resend-otp/`, `/api/logout/`
- **Google OAuth:** `/api/auth/google/login/`, `/api/auth/google/callback/`, `/api/auth/google/exchange/`
- **Catalog/cart (DRF router):** `/api/categories/`, `/api/products/`, `/api/cart/`
- **Payments/orders:** `/api/payment/key/`, `/api/payment/create-order/`, `/api/payment/verify/`, `/api/payment/webhook/`, `/api/orders/`, `/api/orders/<order_id>/`
- **Addresses:** `/api/addresses/`, `/api/addresses/create/`
- **Health:** `/api/health/`

## Testing

### Backend

```bash
python manage.py test Archives.tests.test_google_auth --keepdb --verbosity 1
```

### Frontend (from SPA directory)

```bash
npx vitest
npx playwright test
```

## Build and deployment

Root build command:

```bash
npm run build
```

This executes `build.sh`, which:

1. Builds the Vite frontend
2. Runs Django `collectstatic`
3. Creates `.vercel/output`
4. Writes Vercel route config for API + SPA fallback

## Extra project docs

- `SECURITY.md`
- `OAUTH_IMPLEMENTATION_GUIDE.md`
- `OAUTH_ROUTING_MAP.md`
- `VERCEL_ENV_SETUP.md`
- `BACKEND_DOCUMENTATION.md`
