# Vercel Environment Variables Setup for Google OAuth

## Required Environment Variables

Add these to your Vercel project settings (Settings → Environment Variables):

### 1. Google OAuth Configuration

```
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://thearchives-chi.vercel.app/api/auth/google/callback/
```

### 2. Frontend Configuration

```
FRONTEND_BASE_URL=https://thearchives-chi.vercel.app
```

### 3. Security Configuration

```
ALLOWED_HOSTS_CSV=thearchives-chi.vercel.app,.vercel.app
CSRF_TRUSTED_ORIGINS_CSV=https://thearchives-chi.vercel.app
```

### 4. Database & Other Settings

```
DEBUG=0
SECRET_KEY=<generate-a-secure-key>
DATABASE_URL=<your-database-url>
```

---

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://thearchives-chi.vercel.app/api/auth/google/callback/
   ```
5. Click **Save**

### Important Notes:
- The redirect URI **MUST** end with a trailing slash `/`
- It **MUST** match exactly what's in `GOOGLE_REDIRECT_URI` environment variable
- It should point to the Django backend route, NOT the frontend route

---

## How to Add Environment Variables on Vercel

### Method 1: Via Vercel Dashboard

1. Go to your project on Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `GOOGLE_CLIENT_ID`)
   - **Value**: The actual value
   - **Environment**: Select Production (and Preview if needed)
4. Click **Save**
5. **Redeploy** your application for changes to take effect

### Method 2: Via Vercel CLI

```bash
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add GOOGLE_REDIRECT_URI production
vercel env add FRONTEND_BASE_URL production
vercel env add ALLOWED_HOSTS_CSV production
vercel env add CSRF_TRUSTED_ORIGINS_CSV production
```

---

## Verification Steps

After setting up environment variables:

1. **Redeploy** your Vercel project
2. Check the deployment logs for any errors
3. Test the OAuth flow:
   - Go to: `https://thearchives-chi.vercel.app/api/auth/google/login/`
   - You should be redirected to Google login
   - After login, you should be redirected back to your app (not 404)

---

## Troubleshooting

### Still getting 404?

Check if the route is accessible:
```bash
curl https://thearchives-chi.vercel.app/api/auth/google/callback/
```

### Still getting state_mismatch?

1. Ensure cookies are enabled
2. Check that `GOOGLE_REDIRECT_URI` matches exactly in:
   - Vercel environment variables
   - Google Cloud Console authorized redirect URIs
3. Make sure the domain matches (no www vs non-www mismatch)

### Check environment variables are loaded:

Add a debug endpoint temporarily to verify:
```python
# In views.py
def debug_config(request):
    return JsonResponse({
        'GOOGLE_REDIRECT_URI': settings.GOOGLE_REDIRECT_URI,
        'FRONTEND_BASE_URL': settings.FRONTEND_BASE_URL,
        'has_client_id': bool(settings.GOOGLE_CLIENT_ID),
    })
```

---

## Security Checklist

✅ Never commit `.env` files or secrets to git  
✅ Use different credentials for development and production  
✅ Rotate secrets regularly  
✅ Set `DEBUG=0` in production  
✅ Use strong `SECRET_KEY` (generate with: `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`)

---

## Quick Fix Commands

```bash
# Generate a secure Django SECRET_KEY
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Redeploy after adding environment variables
vercel --prod

# View deployment logs
vercel logs <deployment-url>
```
