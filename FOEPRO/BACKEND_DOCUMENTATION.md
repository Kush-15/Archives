# Backend Authentication System Documentation

## Database Schema

### User Table (archives_users)
```sql
CREATE TABLE archives_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Hashed using Django's password hashing
    created_at DATETIME AUTO_NOW_ADD,
    updated_at DATETIME AUTO_NOW,
    is_active BOOLEAN DEFAULT TRUE
);
```

### Fields Description
- **id**: Primary key, auto-generated
- **username**: Unique username (max 150 characters)
- **email**: Unique email address for recovery & communication
- **phone**: Unique phone number (10 digits)
- **password**: Bcrypt hashed password (max 255 characters)
- **created_at**: Account creation timestamp
- **updated_at**: Last update timestamp
- **is_active**: Flag to enable/disable accounts

---

## API Endpoints

### 1. Sign Up
**Endpoint**: `POST /api/signup/`

**Request Body**:
```json
{
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "SecurePass123"
}
```

**Success Response** (201):
```json
{
    "status": "success",
    "message": "Registration successful! Please sign in.",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com"
    }
}
```

**Error Response** (400):
```json
{
    "status": "error",
    "message": "Username already taken"
}
```

### 2. Sign In
**Endpoint**: `POST /api/signin/`

**Request Body**:
```json
{
    "username": "john_doe",
    "password": "SecurePass123"
}
```

**Success Response** (200):
```json
{
    "status": "success",
    "message": "Welcome back, john_doe!",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com"
    }
}
```

**Error Response** (401):
```json
{
    "status": "error",
    "message": "Invalid username or password"
}
```

### 3. Logout
**Endpoint**: `GET /logout/`

**Response**: Redirects to homepage and clears session

---

## Validation Rules

### Username
- Unique
- Max 150 characters
- Required

### Email
- Unique
- Must be valid email format
- Required

### Phone
- Unique
- Must be exactly 10 digits
- Required

### Password
- Minimum 6 characters
- Hashed using Django's PBKDF2 algorithm
- Required

---

## Security Features

1. **Password Hashing**: All passwords are hashed using Django's PBKDF2 algorithm
2. **Session Management**: User sessions stored in Django sessions
3. **CSRF Protection**: CSRF tokens required for POST requests
4. **Input Validation**: All inputs validated on both client and server side
5. **Unique Constraints**: Username, email, and phone must be unique

---

## Setup Instructions

### 1. Create Migrations
```bash
python manage.py makemigrations Archives
python manage.py migrate
```

### 2. Verify Database Table
```bash
python manage.py dbshell
SELECT * FROM archives_users;
```

### 3. Test Sign Up
```bash
curl -X POST http://localhost:8000/api/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "phone": "9876543210",
    "password": "TestPassword123"
  }'
```

---

## File Structure

```
Archives/
├── models.py          # User model definition
├── forms.py           # UserSignUpForm, UserSignInForm
├── views.py           # API views & page views
├── urls.py            # URL routing
├── migrations/
│   └── 0001_initial.py    # Database migration
└── templates/
    └── Archives/
        └── sign.html      # Updated with API calls
```

---

## Frontend Integration

The sign.html form is updated to:
1. Validate input on the client side
2. Send form data to `/api/signup/` endpoint
3. Handle success/error responses
4. Redirect to home page on successful registration

---

## Next Steps

1. Run migrations: `python manage.py migrate`
2. Restart Django server: `python manage.py runserver`
3. Test the sign-up form at `/sign/`
4. View users in admin panel at `/admin/`

