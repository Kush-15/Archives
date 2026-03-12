# TheArchives - E-Commerce Platform

A modern, full-stack e-commerce platform built with Django and React, featuring user authentication, product catalog management, shopping cart functionality, and product reviews.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Development](#development)

---

## 🎯 Overview

**TheArchives** is a vintage-themed e-commerce platform that allows users to browse products, manage shopping carts, leave product reviews, and complete purchases. The backend is built with Django and Django REST Framework, while the frontend is a modern React SPA (Single Page Application).

### Key URLs
- **Production**: https://archives-sable.vercel.app
- **Local Development**: http://localhost:8000

---

## ✨ Features

### User Management
- ✅ User registration and authentication
- ✅ Email-based OTP verification (10-minute validity)
- ✅ Secure password hashing (PBKDF2)
- ✅ Session-based authentication
- ✅ User profile management

### E-Commerce
- ✅ Product catalog with categories
- ✅ Product search and filtering
- ✅ Product ratings and reviews (1-5 stars)
- ✅ Shopping cart management
- ✅ Stock management
- ✅ Real-time rating statistics

### Technical Features
- ✅ RESTful API with Django REST Framework
- ✅ CSRF protection
- ✅ Token-based authentication
- ✅ Multi-database support (SQLite, PostgreSQL)
- ✅ Single Page Application (SPA) routing
- ✅ Static file serving with WhiteNoise

---

## 🛠 Tech Stack

### Backend
- **Framework**: Django 5.2.10
- **REST API**: Django REST Framework 3.16.1
- **Database**: PostgreSQL / SQLite
- **Authentication**: Django Session + Token Auth
- **Static Files**: WhiteNoise 6.x
- **Email**: Django SMTP with Gmail

### Frontend
- **Framework**: React
- **API Client**: Fetch API / Axios (integrated in SPA)
- **Build Tool**: Node.js / npm
- **Styling**: Custom CSS (vintage-themed)
- **Routing**: React Router (SPA)

### Deployment
- **Platform**: Vercel
- **Database**: Supabase PostgreSQL
- **Static Files**: Vercel / WhiteNoise

### Development Tools
- Python 3.9+
- Django 5.2
- PostgreSQL 13+
- Node.js 16+

---

## 📁 Project Structure

```
Archives/
├── FOEPRO/                          # Main Django project
│   ├── FOEPRO/
│   │   ├── settings.py              # Django configuration
│   │   ├── urls.py                  # Main URL routing
│   │   ├── wsgi.py                  # WSGI application
│   │   └── asgi.py                  # ASGI application
│   ├── Archives/                    # Main Django app
│   │   ├── models.py                # Database models
│   │   ├── views.py                 # View functions and ViewSets
│   │   ├── serializers.py           # DRF serializers
│   │   ├── urls.py                  # App-level URL routing
│   │   ├── forms.py                 # Django forms
│   │   ├── authentication.py        # Custom authentication
│   │   ├── admin.py                 # Django admin configuration
│   │   ├── migrations/              # Database migrations
│   │   ├── templates/               # HTML templates & SPA dist
│   │   ├── static/                  # Static files (CSS, JS, images)
│   │   └── management/              # Custom management commands
│   ├── api/
│   │   └── index.py                 # Vercel serverless function
│   ├── core/
│   │   └── views_health.py          # Health check endpoint
│   ├── manage.py                    # Django management script
│   ├── requirements.txt             # Python dependencies
│   ├── vercel.json                  # Vercel configuration
│   ├── db.sqlite3                   # Local SQLite database
│   └── README.md                    # Detailed project documentation
├── .env                             # Environment variables (not committed)
└── .venv/                           # Python virtual environment
```

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.9 or higher
- Node.js 16 or higher
- PostgreSQL 13+ (optional for production)
- pip and npm package managers

### Backend Setup

#### 1. Navigate to the project directory
```bash
cd FOEPRO
```

#### 2. Create and activate virtual environment
```bash
python -m venv .venv

# On Windows
.venv\Scripts\activate

# On macOS/Linux
source .venv/bin/activate
```

#### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

#### 4. Create `.env` file in the FOEPRO directory
```env
# Debug mode (set to False in production)
DEBUG=True

# Secret key for Django
SECRET_KEY=your-secure-secret-key-here

# Database configuration (for local development, uses SQLite by default)
# For PostgreSQL:
DATABASE_URL=postgresql://user:password@localhost:5432/archives

# Email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True

# Use remote database
USE_REMOTE_DB=0
RUNSERVER_REMOTE_DB=0
```

#### 5. Run database migrations
```bash
python manage.py makemigrations Archives
python manage.py migrate
```

#### 6. Create a superuser (admin account)
```bash
python manage.py createsuperuser
# Enter username, email, phone, and password when prompted
```

#### 7. Start the development server
```bash
python manage.py runserver
# Server runs at http://localhost:8000
```

---

## ⚙️ Configuration

### Environment Variables

#### Development
```env
DEBUG=True
SECRET_KEY=dev-secret-key
DATABASE_URL=sqlite:///db.sqlite3
USE_REMOTE_DB=0
```

#### Production (Vercel + Supabase)
```env
DEBUG=False
SECRET_KEY=<your-secure-key>
DATABASE_URL=<supabase-connection-string>
VERCEL=true
USE_REMOTE_DB=1
ALLOWED_HOSTS=archives-sable.vercel.app,.vercel.app
CSRF_TRUSTED_ORIGINS=https://archives-sable.vercel.app
```

### Database Selection

The app automatically selects the database based on environment:

1. **Local Development** (runserver + no USE_REMOTE_DB):
   - Uses SQLite (`db.sqlite3`)

2. **DEBUG Mode** (no Vercel):
   - Uses SQLite unless `USE_REMOTE_DB=1`

3. **Production** (Vercel or DEBUG=False):
   - Uses PostgreSQL via `DATABASE_URL`

---

## 📊 Database Models

### Core Models

**User** - Custom user model with authentication
- username, email, phone (all unique)
- password (hashed with PBKDF2)
- is_active, is_verified, otp fields
- created_at, updated_at timestamps

**Category** - Product categories
- name (unique)
- slug (auto-generated from name)

**Product** - E-commerce products
- category (ForeignKey to Category)
- name, description, price, stock
- rating_avg (auto-calculated), rating_count
- slug (unique, auto-generated)

**ProductReview** - User reviews for products
- UUID primary key
- product, user (unique together)
- rating (1-5), review_text, review_date

**Cart** - Shopping cart per user
- OneToOne relationship with User
- Auto-tracks creation/update time

**CartItem** - Items in user's cart
- cart, product (unique together)
- quantity

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup/` | Register new user |
| POST | `/api/signin/` | User login |
| POST | `/api/verify-otp/` | Verify email OTP |
| POST | `/api/resend-otp/` | Resend OTP to email |
| GET | `/logout/` | User logout |
| GET | `/api/email-status/` | Check email verification status |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories/` | List all categories |
| GET | `/api/products/` | List products (supports filtering) |
| GET | `/product/<slug>/` | Get product details |

### Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart/` | Get user's cart |
| POST | `/api/cart/add_to_cart/` | Add item to cart |
| DELETE | `/api/cart/<id>/` | Remove item from cart |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/<id>/reviews/` | List product reviews |
| POST | `/api/products/<id>/reviews/` | Create new review |

---

## 🔐 Authentication

### Validation Rules

- **Username**: Unique, max 150 chars
- **Email**: Unique, valid format, required
- **Phone**: Unique, 10 digits
- **Password**: Min 6 chars, hashed with PBKDF2
- **OTP**: 6 digits, expires in 10 minutes

### Security Features

✅ Password hashing (PBKDF2)
✅ Session management
✅ CSRF protection
✅ Input validation
✅ Unique constraints on sensitive fields
✅ Token-based API authentication

---

## 🌐 Deployment

### Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Set environment variables in Vercel dashboard
# DATABASE_URL, DEBUG, SECRET_KEY, EMAIL credentials, VERCEL=true

# 4. Run migrations
vercel env pull
VERCEL=true python manage.py migrate
```

### Local Production Testing

```bash
# Test with DEBUG=False
DEBUG=False SECRET_KEY=test-key python manage.py runserver

# Collect static files
python manage.py collectstatic --noinput
```

---

## 🔧 Development

### Running Locally

```bash
# Activate virtual environment
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Start development server
python manage.py runserver

# Access admin panel at http://localhost:8000/admin/
```

### Useful Commands

```bash
# Create database migrations
python manage.py makemigrations Archives

# Apply migrations
python manage.py migrate

# Create admin account
python manage.py createsuperuser

# Open Django shell
python manage.py shell

# Run tests
python manage.py test Archives

# Collect static files
python manage.py collectstatic --noinput
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "No module named 'Archives'" | Ensure you're in FOEPRO directory |
| Database connection error | Check DATABASE_URL and PostgreSQL status |
| CSRF token missing | Include X-CSRFToken header in API requests |
| Static files not loading | Run `collectstatic --noinput` |

---

## 📚 Related Documentation

- **[Detailed Backend Docs](./FOEPRO/BACKEND_DOCUMENTATION.md)** - Comprehensive API and database schema documentation
- [Django Docs](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Vercel Deployment](https://vercel.com/docs)
- [Supabase PostgreSQL](https://supabase.io/docs)

---

## 💡 Key Technologies Used

| Component | Technology |
|-----------|------------|
| Backend Framework | Django 5.2.10 |
| REST API | Django REST Framework |
| Database | PostgreSQL / SQLite |
| Frontend | React SPA |
| Authentication | Django Session + Token |
| Deployment | Vercel |
| Static Files | WhiteNoise |
| Email | Gmail SMTP |

---

## 📝 Recent Changelog

### v1.0.4 (Latest)
- UI improvements and bug fixes
- Enhanced product catalog
- Improved cart functionality

### v1.0.3
- UI refinements

### v1.0.2
- Additional features

### v1.0.1
- Initial UI implementation

### v1.0.0
- First full-stack release

---

## 📞 Support

1. Check the detailed documentation in `FOEPRO/BACKEND_DOCUMENTATION.md`
2. Review recent git commits for changes
3. Check git logs: `git log --oneline -20`

---

**Project**: TheArchives - E-Commerce Platform
**Status**: Active Development
**Last Updated**: March 2026
**Version**: UI 1.0.4
