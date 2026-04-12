# Google OAuth 2.0 Complete Implementation Guide

## Overview
This document describes the complete, working Google OAuth 2.0 implementation with all fixes and enhancements applied.

## All Fixes Applied

### 1. Session Persistence & Cookies (FOEPRO/settings.py)
```python
# Production Settings
SESSION_COOKIE_SECURE = True          # HTTPS only
CSRF_COOKIE_SECURE = True             # HTTPS only
SESSION_COOKIE_SAMESITE = 'Lax'       # ← FIX: Allow OAuth redirects
CSRF_COOKIE_SAMESITE = 'Lax'          # ← FIX: Allow CSRF during OAuth
SESSION_COOKIE_DOMAIN = None          # ← FIX: Allow all hosts
CSRF_COOKIE_DOMAIN = None             # ← FIX: Allow all hosts
```

**Why:** Browsers block session cookies on cross-site redirects without `SameSite=Lax`. Google redirects back to your callback endpoint, so the session cookie must be sent.

---

### 2. Force Session Save (Archives/google_oauth.py:234)
```python
def google_auth_start(request):
    state = secrets.token_urlsafe(32)
    request.session[_SK_STATE] = state
    request.session.save()  # ← FIX: Force persist to database
```

**Why:** Django sessions are lazy by default. During OAuth with redirects, the session might not persist to the database automatically. Explicit `save()` ensures state is saved.

---

### 3. Proper Redirect URL Construction (Archives/google_oauth.py:264-271)
```python
frontend_base = str(getattr(settings, 'FRONTEND_BASE_URL', '')).strip().rstrip('/')
if frontend_base:
    parsed_frontend = urlparse(frontend_base)
    frontend_host, _ = _split_host_port(parsed_frontend.netloc)
    if not settings.DEBUG and frontend_host in {'127.0.0.1', 'localhost'}:
        frontend_base = f'{request.scheme}://{request.get_host()}'
else:
    frontend_base = f'{request.scheme}://{request.get_host()}'
```

**Why:** Fallback to `request.get_host()` if `FRONTEND_BASE_URL` is not set or contains localhost in production. Ensures redirect URL is always correct.

---

### 4. Session Cleanup on Callback (Archives/google_oauth.py:507-509)
```python
request.session.pop(_SK_STATE, None)
request.session.pop(_SK_NEXT, None)
request.session.save()  # ← FIX: Persist cleanup
```

**Why:** Clear temporary OAuth state after callback completes. Explicit `save()` ensures cleanup persists.

---

### 5. Comprehensive Logging - Backend (Archives/google_oauth.py)

#### In `google_auth_start()`:
```python
print(f"  State stored: {state[:20]}...")
print(f"  Session key: {request.session.session_key}")
print(f"  Session saved: {_SK_STATE in request.session}")
```

#### In `google_auth_callback()`:
```python
print(f"  Session key in callback: {request.session.session_key}")
print(f"  Session data in callback: {dict(request.session)}")
print(f"  State received from URL: {state_received[:20] if state_received else 'MISSING'}...")
print(f"  State expected from session: {state_expected[:20] if state_expected else 'MISSING'}...")
print(f"  Cookies in request: {dict(request.COOKIES)}")
```

#### In `google_auth_exchange()`:
```python
print(f"  Handoff code received: {handoff_code[:30]}...")
print(f"  Code hash verified ✓")
print(f"  TTL valid (age: {age}s, ttl: {HANDOFF_TTL_SECONDS}s) ✓")
print(f"  User retrieved: {user.email} (id: {uid}) ✓")
print(f"  Token created/retrieved ✓")
```

---

### 6. Enhanced Error Responses - Backend (Archives/google_oauth.py:550-583)
```python
# All error responses now include 'status': 'error' field
return JsonResponse({
    'error': 'Invalid handoff code',
    'status': 'error'  # ← FIX: Consistent error format
}, status=400)

# Success response
return JsonResponse({
    'status': 'success',
    'token': token.key,
    'user': { ... },
    'redirect_to': redirect_to,
})
```

---

### 7. Enhanced Frontend Logging (src/context/AuthContext.tsx:231-260)
```typescript
const completeGoogleLogin = useCallback(async (code: string) => {
  console.log('[OAuth] Starting Google login completion with handoff code:', code?.substring(0, 20) + '...');
  
  const res = await apiFetch('/api/auth/google/exchange/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  console.log('[OAuth] Exchange response status:', res.status);
  const data = await res.json();
  console.log('[OAuth] Exchange response data:', { status: data.status, hasToken: !!data.token });
  
  // Validate response format
  if (data.error) {
    console.error('[OAuth] Error in response:', data.error);
    return { ok: false, message: data.error };
  }
  
  if (res.ok && data.status === 'success') {
    console.log('[OAuth] Exchange successful');
    // Store token and user...
    return { ok: true, redirectTo: data.redirect_to };
  }

  return { ok: false, message: data.error || 'Google sign-in failed' };
}, []);
```

---

### 8. Enhanced React Callback Logging (src/pages/GoogleAuthCallback.tsx:38-92)
```typescript
useEffect(() => {
  const code = searchParams.get('hcode');
  const errorParam = searchParams.get('error');

  console.log('[OAuth Callback] Received params:', { hasCode: !!code, hasError: !!errorParam });

  if (errorParam) {
    console.error('[OAuth Callback] Google returned error:', errorParam);
    setError(friendlyError(errorParam));
    return;
  }

  if (!code) {
    console.error('[OAuth Callback] Missing handoff code in URL');
    setError('Missing authorization code.');
    return;
  }

  // ... exchange logic with detailed logging
  console.log('[OAuth Callback] Calling completeGoogleLogin...');
  const result = await completeGoogleLogin(code);
  
  if (result.ok) {
    console.log('[OAuth Callback] Exchange successful');
    navigate(result.redirectTo || '/profile', { replace: true });
  } else {
    console.error('[OAuth Callback] Exchange failed:', result.message);
    setError(result.message || 'Google sign-in failed.');
  }
}, [searchParams, completeGoogleLogin, navigate]);
```

---

### 9. Proper Routing Configuration (build.sh:35-48)
```json
{
  "version": 3,
  "routes": [
    { "src": "/api/auth/google/(.*)", "dest": "/api/index" },
    { "src": "/api/(.*)", "dest": "/api/index" },
    { "src": "/static/(.*)", "continue": true },
    { "src": "/assets/(.*)", "continue": true },
    { "handle": "filesystem" },
    { "src": "/(.*)", "status": 200, "dest": "/index.html" }
  ]
}
```

**Fixed:** Removed incorrect `/api/auth/callback` route that was causing confusion.

---

### 10. Proper Django URLs (Archives/urls.py:39-42)
```python
path('api/auth/google/login/', google_auth_start, name='google_auth_login'),
path('api/auth/google/start/', google_auth_start, name='google_auth_start'),
path('api/auth/google/callback/', google_auth_callback, name='google_auth_callback'),
path('api/auth/google/exchange/', google_auth_exchange, name='google_auth_exchange'),
```

---

### 11. Required Environment Variables (Vercel)
```bash
# CRITICAL - Must be exact
FRONTEND_BASE_URL=https://thearchives-chi.vercel.app        (no trailing slash)
BACKEND_BASE_URL=https://thearchives-chi.vercel.app         (no trailing slash)
GOOGLE_REDIRECT_URI=https://thearchives-chi.vercel.app/api/auth/google/callback/  (WITH trailing slash)

# Required
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# Supporting
ALLOWED_HOSTS_CSV=thearchives-chi.vercel.app,.vercel.app
CSRF_TRUSTED_ORIGINS_CSV=https://thearchives-chi.vercel.app
DATABASE_URL=<your-database>
SECRET_KEY=<production-key>
```

---

### 12. Google Cloud Console Configuration
**Authorized Redirect URIs must include (exactly):**
```
https://thearchives-chi.vercel.app/api/auth/google/callback/
```

⚠️ **Trailing slash is critical!** Google requires exact match.

---

## Complete OAuth Flow with All Fixes

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User clicks "Sign in with Google"                       │
│ Frontend: window.location.href = '/api/auth/google/login/'       │
└─────────────────────────┬───────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: GET /api/auth/google/login/               
