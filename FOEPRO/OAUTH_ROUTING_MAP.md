# Google OAuth 2.0 Complete Routing & Session Flow Mapping

## 1. DJANGO ROUTE DEFINITIONS (Archives/urls.py:39-42)

| Endpoint | Method | Handler | Purpose |
|----------|--------|---------|---------|
| `/api/auth/google/login/` | GET | `google_auth_start()` | Generate state, store in session, redirect to Google |
| `/api/auth/google/callback/` | GET | `google_auth_callback()` | Receive auth code, validate state, create user |
| `/api/auth/google/exchange/` | POST | `google_auth_exchange()` | Exchange handoff code for DRF token |

## 2. VERCEL ROUTING (build.sh:35-48)

```json
{ "src": "/api/auth/google/(.*)", "dest": "/api/index" }     // Routes to Django
{ "src": "/api/(.*)", "dest": "/api/index" }                 // API fallback
{ "src": "/(.*)", "status": 200, "dest": "/index.html" }     // SPA fallback
```

## 3. REACT ROUTE (App.tsx:87)

```tsx
<Route path="/auth/callback" element={<GoogleAuthCallback />} />
```

## 4. COMPLETE OAUTH FLOW

```
Step 1: GET /api/auth/google/login/
        ↓ (Routes: /api/auth/google/(.*) → Django)
        
Step 2: Django generates state
        - Generate: state = secrets.token_urlsafe(32)
        - Store: request.session[_SK_STATE] = state
        - PERSIST: request.session.save()  [← FIX 1: CRITICAL]
        - Cookie: Set-Cookie: sessionid=xyz; SameSite=Lax; Secure  [← FIX 2]
        
Step 3: Django redirects to Google
        302 Location: https://accounts.google.com/o/oauth2/v2/auth
        ?client_id=...&redirect_uri=...&state=eyJx...
        
Step 4: User authenticates on Google ↔ Google redirects back
        GET /api/auth/google/callback/?code=4/0AXk...&state=eyJx...
        Cookie: sessionid=xyz  [← Browser sends it]
        
Step 5: Django validates state
        - Retrieve: state_expected = request.session.get(_SK_STATE)
        - Compare: state_received (from URL) == state_expected
        - ✅ If match: Exchange code for token
        - ❌ If no match: Error "state_mismatch"  [← PREVIOUS ERROR]
        
Step 6: Django exchanges code for token
        - POST to Google OAuth token endpoint
        - Receive: id_token, access_token
        - Verify token signature with Google public key
        - Extract user info: email, name, google_sub
        
Step 7: Django creates/links user
        - Create user in database if new
        - Generate handoff code (one-time use, 120s TTL)
        - Store in session
        
Step 8: Django redirects to React callback
        302 Location: /auth/callback?hcode=rF3+WxM...
        
Step 9: Browser navigates to /auth/callback
        GET /auth/callback?hcode=rF3+WxM...
        ↓ (Routes: /(.*) → /index.html → React)
        
Step 10: React GoogleAuthCallback component
         - Extracts hcode from URL
         - Calls completeGoogleLogin(hcode)
         
Step 11: React makes exchange request
         POST /api/auth/google/exchange/
         { "code": "rF3+WxM..." }
         
Step 12: Django validates handoff code
         - Load from session
         - Hash and compare
         - Check TTL
         - Return token + user info
         
Step 13: User logged in ✅
         - React stores token
         - Uses for all API requests
         - Navigate to /profile
```

## 5. SESSION COOKIE FLOW (CRITICAL FIX)

### What Was Broken:
```
Step 2: Django creates session, sets cookie
        Set-Cookie: sessionid=xyz  [← No SameSite, might not persist]
        
Step 4: Google redirects browser to callback
        Browser receives: code & state from Google
        Browser sends cookies? ❌ BLOCKED (no SameSite=Lax)
        
Result: Django can't find session in Step 5
        state_expected = request.session.get(_SK_STATE)  → None
        Validation fails: None != 'eyJx...' → state_mismatch error
```

### What We Fixed:
```
Step 2: Django creates session, sets cookie with SameSite=Lax
        Set-Cookie: sessionid=xyz; SameSite=Lax; Secure; Domain=None
        request.session.save()  [← Force persist to database]
        
Step 4: Google redirects browser to callback
        Browser receives: code & state from Google
        Browser sends cookies ✅ (SameSite=Lax allows this)
        Cookie: sessionid=xyz
        
Step 5: Django retrieves state from session ✅
        state_expected = request.session.get(_SK_STATE)  → 'eyJx...'
        Validation succeeds: 'eyJx...' == 'eyJx...' ✅
```

## 6. SETTINGS.PY CONFIGURATION

```python
# Production (not DEBUG)
if not DEBUG:
    SESSION_COOKIE_SECURE = True           # HTTPS only
    CSRF_COOKIE_SECURE = True              # HTTPS only
    SESSION_COOKIE_SAMESITE = 'Lax'        # FIX 1: Allow OAuth redirects
    CSRF_COOKIE_SAMESITE = 'Lax'           # FIX 2: Allow CSRF on OAuth
    SESSION_COOKIE_DOMAIN = None           # FIX 3: Allow all hosts
    CSRF_COOKIE_DOMAIN = None              # FIX 4: Allow all hosts

# Development
else:
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False          # HTTP OK in dev
    CSRF_COOKIE_SECURE = False
    SESSION_COOKIE_DOMAIN = None
    CSRF_COOKIE_DOMAIN = None
```

## 7. ENVIRONMENT VARIABLES (Vercel)

```bash
# CRITICAL: Must match exactly
FRONTEND_BASE_URL=https://thearchives-chi.vercel.app          (no slash)
BACKEND_BASE_URL=https://thearchives-chi.vercel.app           (no slash)
GOOGLE_REDIRECT_URI=https://thearchives-chi.vercel.app/api/auth/google/callback/  (WITH slash)

# Required
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# Supporting
ALLOWED_HOSTS_CSV=thearchives-chi.vercel.app,.vercel.app
CSRF_TRUSTED_ORIGINS_CSV=https://thearchives-chi.vercel.app
DATABASE_URL=<your-database>
SECRET_KEY=<production-key>
```

## 8. GOOGLE CLOUD CONSOLE

Authorized Redirect URIs must include:
```
https://thearchives-chi.vercel.app/api/auth/google/callback/
```

⚠️ Must have trailing slash! Google requires exact match.

## 9. DEBUG LOGGING OUTPUT (Expected)

When working correctly, Vercel logs should show:

```
==============================================================================
GOOGLE LOGIN START
  Request URL: https://thearchives-chi.vercel.app/api/auth/google/login/
  Session key: abc123xyz...
  State stored: eyJxb3JhbWhWdWM...
  Session saved: True
==============================================================================

==============================================================================
CALLBACK HIT! Received request:
  URL: https://thearchives-chi.vercel.app/api/auth/google/callback/?code=4/0AXk...&state=eyJxb3JhbWhWdWM...
  Session key in callback: abc123xyz...
  Session data in callback: {'google_oauth_state': 'eyJxb3JhbWhWdWM...', ...}
  State received from URL: eyJxb3JhbWhWdWM...
  State expected from session: eyJxb3JhbWhWdWM...
  Cookies in request: {'sessionid': 'abc123xyz...'}
==============================================================================
```

✅ If states MATCH and sessionid cookie is present = SUCCESS!

## 10. COMMON ISSUES & FIXES

| Issue | Cause | Fix |
|-------|-------|-----|
| `state_mismatch` | Session cookie not sent or persisted | Add `SESSION_COOKIE_SAMESITE='Lax'` + `request.session.save()` |
| 404 on `/api/auth/callback` | Wrong routing rule | Remove incorrect rule from build.sh ✅ (DONE) |
| `redirect_uri_mismatch` | Google URI doesn't match Cloud Console | Exact match: `https://thearchives-chi.vercel.app/api/auth/google/callback/` |
| Cookie not sent on callback | Domain or SameSite restriction | Set `DOMAIN=None`, `SAMESITE='Lax'` |

