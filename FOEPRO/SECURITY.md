# Security Guidelines for The Archives

## Overview

This document describes the security-sensitive parts of The Archives project with
an emphasis on Google OAuth 2.0 authentication. Maintain this file as the
implementation evolves. The goals are to accelerate reviews, aid incident
response, and provide operators with the exact behaviors to expect.

## Google OAuth 2.0 Flow

```
User → /api/auth/google/login/ → Google → /api/auth/google/callback/
     (state stored in session)       (verifies token) → handoff code
        ↓                                             ↓
Frontend /auth/callback?code=... → /api/auth/google/exchange/ → DRF token
```

### Key Guarantees

- **State validation**: Random state stored in session; mismatch redirects with
  `state_mismatch` error.
- **Token verification**: Uses `google.oauth2.id_token.verify_oauth2_token` with
  issuer validation, `email_verified` check, and 10-second clock skew tolerance.
- **Account linking rules**:
  1. Match existing `google_sub`
  2. Match on email (case-insensitive) only if `google_sub` empty **and**
     `is_active=True`
  3. Create new user with unusable password
- **Handoff security**: 48-byte token hashed via SHA-256, one-time use, 120s TTL.
- **Exchange throttling**: `/api/auth/google/exchange/` rate limited to
  10 POST requests per hour per IP.

### Error Codes Returned to Frontend

| Code | Meaning | Trigger |
|------|---------|---------|
| `state_mismatch` | Session expired or tampered state | State mismatch
| `google_no_code` | Google did not send `code` | Missing `code`
| `google_email_not_verified` | User email not verified | `email_verified` False
| `google_sub_mismatch` | Email already linked to different Google account | Duplicate linking attempt
| `google_account_inactive` | Account disabled | `is_active=False`
| `google_id_token_invalid` | Token verification failure | Invalid ID token
| `google_invalid_issuer` | Token not from Google | Issuer mismatch
| `token_exchange_failed` | Network/OAuth error | Google token endpoint failure
| `redirect_uri_mismatch` | Config mismatch | Google OAuth misconfiguration

### Deployment Checklist

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` set.
- `GOOGLE_REDIRECT_URI` matches Google Cloud Console and environment (dev vs prod).
- `FRONTEND_BASE_URL` appended to `CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS`.
- `SESSION_COOKIE_SECURE=True`, `CSRF_COOKIE_SECURE=True`, and SameSite=Lax or Strict
  in production.
- HTTPS enforced in production via proxy settings.

### Operational Guidance

- Monitor logs for `Google OAuth state mismatch` or repeated `token_exchange_failed`.
- Investigate recurring `google_sub_mismatch` errors as potential account linking attacks.
- Rate limit responses return HTTP 429. More aggressive policies can be applied via
  `django-ratelimit` configuration.
- When rotating credentials, restart the server to ensure `_get_credentials()` cache
  is cleared or call the test helper `_clear_credentials_cache()`.

## Incident Response Notes

- **Suspected account hijack**: Check user records for `google_sub` changes in
  `Archives_user` table. Each change should have corresponding log entries.
- **State mismatch spikes**: Likely due to session store issues or cross-site requests.
- **Redirect URI errors**: Usually happen after deploying new environments without
  updating Google Cloud Console OAuth credentials.

## Testing Recommendations

- Use `FOEPRO/test_google_token.py` for token verification debugging.
- Automate tests in `Archives/tests/test_google_auth.py` (add more coverage
  as new flows are introduced).
- Manual smoke tests:
  1. Link fresh Google account
  2. Link Google to existing email user
  3. Attempt linking to inactive account (should fail)
  4. Reuse handoff code (should fail)
  5. Perform >10 exchanges to trigger rate limiter

## Future Enhancements

- Add audit trail for OAuth logins (timestamp + IP + UA).
- Store last successful Google login metadata for anomaly detection.
- Enforce stricter rate limits in production environments via environment vars.

---

Maintainers: update this document whenever authentication logic changes or new
security controls are added.
