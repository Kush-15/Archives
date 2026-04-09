"""
Google OAuth 2.0 views for Django-owned authentication.

Endpoints:
  GET  /api/auth/google/login/     - redirect browser to Google (preferred)
  GET  /api/auth/google/start/     - alias (temporary, for backward compat)
  GET  /api/auth/google/callback/  - Google redirects here
  POST /api/auth/google/exchange/  - SPA exchanges handoff code for DRF token
"""

import hashlib
import json as _json
import logging
import os
import secrets
import time
import re
from urllib.parse import urlencode, urlparse

import requests
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from django.conf import settings
from django.contrib.auth import login as django_login
from django.core.exceptions import ImproperlyConfigured
from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from django_ratelimit.decorators import ratelimit
from rest_framework.authtoken.models import Token

from .models import User

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
HANDOFF_TTL_SECONDS = 120

# Session keys
_SK_STATE = 'google_oauth_state'
_SK_NEXT = 'google_oauth_next'
_SK_HANDOFF = 'google_oauth_handoff'
_SK_HANDOFF_UID = 'google_oauth_handoff_uid'
_SK_HANDOFF_TS = 'google_oauth_handoff_ts'
_SK_HANDOFF_NEXT = 'google_oauth_handoff_next'

_SAFE_NEXT_RE = re.compile(r'^/[A-Za-z0-9_.~:/?#\[\]@!$&\'()*+,;=%-]*$')

# ---------------------------------------------------------------------------
# Credentials loader
# ---------------------------------------------------------------------------
_REQUIRED_JSON_KEYS = {'client_id', 'client_secret'}


def _load_credentials():
    """Load Google OAuth credentials with precedence:

    1. ``GOOGLE_CREDENTIALS_FILE`` env var pointing to a JSON file.
    2. ``GOOGLE_CLIENT_ID`` + ``GOOGLE_CLIENT_SECRET`` values from settings.

    Returns a dict ``{'client_id', 'client_secret', 'redirect_uri'}``.
    Raises ``ImproperlyConfigured`` if no usable source is found.
    """

    def _load_from_file(cred_file: str) -> dict[str, str]:
        try:
            with open(cred_file, 'r') as f:
                raw = _json.load(f)
        except (OSError, _json.JSONDecodeError) as exc:
            raise ImproperlyConfigured(
                f'Failed to read Google credentials file "{cred_file}": {exc}'
            ) from exc

        # Support the Google Cloud Console download format which nests
        # credentials under a "web" or "installed" key.
        if 'web' in raw:
            raw = raw['web']
        elif 'installed' in raw:
            raw = raw['installed']

        missing = _REQUIRED_JSON_KEYS - set(raw.keys())
        if missing:
            raise ImproperlyConfigured(
                f'Google credentials file is missing keys: '
                f'{", ".join(sorted(missing))}'
            )

        redirect_uri = (
            raw.get('redirect_uri')
            or raw.get('redirect_uris', [None])[0]
            or getattr(settings, 'GOOGLE_REDIRECT_URI', '')
        )

        return {
            'client_id': raw['client_id'],
            'client_secret': raw['client_secret'],
            'redirect_uri': redirect_uri,
        }

    # If a credentials file is explicitly provided, use it.
    cred_file = os.environ.get('GOOGLE_CREDENTIALS_FILE', '').strip()
    if cred_file:
        return _load_from_file(cred_file)

    # Otherwise use env/settings values.
    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
    client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', '')

    if client_id and client_secret:
        return {
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': getattr(settings, 'GOOGLE_REDIRECT_URI', ''),
        }

    raise ImproperlyConfigured(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and '
        'GOOGLE_CLIENT_SECRET environment variables, or set '
        'GOOGLE_CREDENTIALS_FILE to a valid credentials JSON file.'
    )


def _get_credentials():
    """Cached wrapper around ``_load_credentials``."""
    if not hasattr(_get_credentials, '_cache'):
        _get_credentials._cache = _load_credentials()
    return _get_credentials._cache


def _clear_credentials_cache():
    """For tests — force re-load on next call."""
    if hasattr(_get_credentials, '_cache'):
        del _get_credentials._cache


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_auth_backend():
    backends = getattr(settings, 'AUTHENTICATION_BACKENDS', None)
    if backends:
        return backends[0]
    return 'django.contrib.auth.backends.ModelBackend'


def _sanitize_next(raw: str | None) -> str:
    """Return a safe same-site relative path, or '/' as fallback."""
    if not raw:
        return '/'
    raw = raw.strip()
    if not _SAFE_NEXT_RE.match(raw):
        return '/'
    return raw


def _split_host_port(netloc: str) -> tuple[str, str]:
    """Return lowercase host + port from a netloc string."""
    if not netloc:
        return '', ''
    host, sep, port = netloc.rpartition(':')
    if sep and port.isdigit():
        return host.lower(), port
    return netloc.lower(), ''


# ---------------------------------------------------------------------------
# 1) GET /api/auth/google/login/?next=/some/path
#    (also aliased as /api/auth/google/start/ for backward compat)
# ---------------------------------------------------------------------------
@require_GET
def google_auth_start(request):
    """Generate state, store it in session, redirect to Google."""
    logger.info('Google OAuth start request received: path=%s', request.path)
    try:
        creds = _get_credentials()
    except ImproperlyConfigured:
        logger.error('Google OAuth start failed: server not configured')
        return JsonResponse(
            {'error': 'Google OAuth is not configured on this server.'},
            status=503,
        )

    client_id = creds['client_id']
    redirect_uri = creds['redirect_uri']

    if not client_id or not redirect_uri:
        logger.error('Google OAuth start failed: missing client_id or redirect_uri')
        return JsonResponse(
            {'error': 'Google OAuth is not configured on this server.'},
            status=503,
        )

    # Canonicalize start host to the redirect_uri host so OAuth start and callback
    # always occur on the same deployment/domain.
    redirect_parts = urlparse(redirect_uri)
    redirect_host, redirect_port = _split_host_port(redirect_parts.netloc)
    current_host, current_port = _split_host_port(request.get_host())
    if (
        not settings.DEBUG
        and redirect_parts.scheme
        and redirect_host
        and current_host
        and current_host != 'testserver'
        and (redirect_host != current_host or (redirect_port and redirect_port != current_port))
    ):
        logger.info(
            'Google OAuth start host mismatch: current_host=%s redirect_host=%s; redirecting start request',
            request.get_host(),
            redirect_parts.netloc,
        )
        canonical_start = f'{redirect_parts.scheme}://{redirect_parts.netloc}{request.path}'
        query_string = request.META.get('QUERY_STRING', '')
        if query_string:
            canonical_start = f'{canonical_start}?{query_string}'
        return HttpResponseRedirect(canonical_start)

    state = secrets.token_urlsafe(32)
    next_path = _sanitize_next(request.GET.get('next'))

    request.session[_SK_STATE] = state
    request.session[_SK_NEXT] = next_path
    request.session.set_expiry(600)  # session valid for 10 min during OAuth
    request.session.save()  # Force session save to persist across redirects.
    logger.debug(
        'Google OAuth start session prepared: session_key=%s has_state=%s next=%s',
        request.session.session_key,
        _SK_STATE in request.session,
        next_path,
    )

    params = {
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': state,
        'access_type': 'online',
        'prompt': 'select_account',
    }
    return HttpResponseRedirect(f'{GOOGLE_AUTH_URL}?{urlencode(params)}')


# ---------------------------------------------------------------------------
# 2) GET /api/auth/google/callback/?code=...&state=...
# ---------------------------------------------------------------------------
@require_GET
def google_auth_callback(request):
    """Validate state, exchange code, verify ID token, link/create user."""
    logger.info('Google OAuth callback received: path=%s', request.path)
    
    frontend_base = str(getattr(settings, 'FRONTEND_BASE_URL', '')).strip().rstrip('/')
    if frontend_base:
        parsed_frontend = urlparse(frontend_base)
        frontend_host, _ = _split_host_port(parsed_frontend.netloc)
        if not settings.DEBUG and frontend_host in {'127.0.0.1', 'localhost'}:
            frontend_base = f'{request.scheme}://{request.get_host()}'
    else:
        frontend_base = f'{request.scheme}://{request.get_host()}'

    def _error_redirect(code: str) -> HttpResponseRedirect:
        return HttpResponseRedirect(f'{frontend_base}/auth/google/callback?error={code}')

    # --- Handle error from Google itself ---
    google_error = request.GET.get('error', '')
    if google_error:
        logger.warning('Google returned error param: %s', google_error)
        # Map known Google errors to stable frontend codes
        error_map = {
            'access_denied': 'access_denied',
            'redirect_uri_mismatch': 'redirect_uri_mismatch',
            'invalid_client': 'invalid_client',
        }
        code = error_map.get(google_error, 'google_error')
        return _error_redirect(code)

    # --- Validate state ---
    # Keep state in session until the callback completes successfully.
    # Some browsers/providers can trigger duplicate callback hits; popping
    # state too early causes false state_mismatch on later valid redirects.
    state_received = request.GET.get('state', '')
    state_expected = request.session.get(_SK_STATE)
    next_path = request.session.get(_SK_NEXT, '/')

    logger.debug(
        'Google OAuth callback state check: session_key=%s has_expected_state=%s has_received_state=%s',
        request.session.session_key,
        bool(state_expected),
        bool(state_received),
    )

    if not state_received or state_received != state_expected:
        logger.warning('Google OAuth state mismatch')
        return _error_redirect('state_mismatch')

    # --- Exchange authorization code for tokens ---
    code = request.GET.get('code', '')
    if not code:
        return _error_redirect('google_no_code')

    try:
        creds = _get_credentials()
    except ImproperlyConfigured:
        return _error_redirect('server_misconfigured')

    try:
        token_resp = requests.post(GOOGLE_TOKEN_URL, data={
            'code': code,
            'client_id': creds['client_id'],
            'client_secret': creds['client_secret'],
            'redirect_uri': creds['redirect_uri'],
            'grant_type': 'authorization_code',
        }, timeout=10)
    except Exception:
        logger.exception('Network error exchanging Google auth code')
        return _error_redirect('token_exchange_failed')

    if not token_resp.ok:
        logger.error(
            'Google token exchange HTTP %s: %s',
            token_resp.status_code,
            token_resp.text[:500],
        )
        # Try to extract a specific error from Google's response
        try:
            err_data = token_resp.json()
            err_type = err_data.get('error', '')
        except Exception:
            err_type = ''

        error_map = {
            'redirect_uri_mismatch': 'redirect_uri_mismatch',
            'invalid_client': 'invalid_client',
            'invalid_grant': 'token_exchange_failed',
        }
        return _error_redirect(error_map.get(err_type, 'token_exchange_failed'))

    try:
        token_data = token_resp.json()
    except Exception:
        logger.exception('Failed to parse Google token response as JSON')
        return _error_redirect('token_exchange_failed')

    if 'id_token' not in token_data:
        logger.error('No id_token in Google response: %s', token_data.get('error'))
        logger.debug('Full token response keys: %s', list(token_data.keys()))
        return _error_redirect('google_no_id_token')

    logger.debug('Received id_token, verifying with client_id: %s', creds['client_id'])

    # --- Decode token WITHOUT verification first to inspect it ---
    import base64
    try:
        parts = token_data['id_token'].split('.')
        if len(parts) == 3:
            # Decode payload (2nd part)
            payload = parts[1]
            # Add padding if needed
            padding = 4 - len(payload) % 4
            if padding != 4:
                payload += '=' * padding
            decoded = base64.urlsafe_b64decode(payload)
            token_payload = _json.loads(decoded)
            logger.debug('ID Token payload (unverified): %s', token_payload)
        else:
            logger.warning('ID Token has %d parts, expected 3', len(parts))
    except Exception as e:
        logger.warning('Could not decode token payload: %s', e)

    # --- Verify ID token ---
    idinfo = None
    try:
        logger.debug('Starting ID token verification with client_id: %s', creds['client_id'])
        idinfo = google_id_token.verify_oauth2_token(
            token_data['id_token'],
            google_requests.Request(),
            creds['client_id'],
            clock_skew_in_seconds=10,
        )
        logger.debug('Token verified successfully. issuer: %s, email_verified: %s', 
                     idinfo.get('iss'), idinfo.get('email_verified'))
    except ValueError as e:
        error_msg = str(e)
        logger.error('Google ID token verification failed: %s', error_msg)
        
        # Try to deserialize anyway and log the token content for debugging
        try:
            import base64
            parts = token_data['id_token'].split('.')
            if len(parts) == 3:
                payload = parts[1]
                padding = 4 - len(payload) % 4
                if padding != 4:
                    payload += '=' * padding
                decoded = base64.urlsafe_b64decode(payload)
                token_payload = _json.loads(decoded)
                logger.error('Token content (unverified): aud=%s, iss=%s, exp=%s, iat=%s, sub=%s',
                           token_payload.get('aud'), token_payload.get('iss'), 
                           token_payload.get('exp'), token_payload.get('iat'), 
                           token_payload.get('sub'))
                logger.error('Expected client_id: %s', creds['client_id'])
        except Exception as debug_e:
            logger.error('Could not debug token: %s', debug_e)
        
        logger.exception('Full traceback:')
        return _error_redirect('google_id_token_invalid')
    except Exception as e:
        logger.error('Unexpected error during token verification: %s', str(e))
        logger.exception('Full traceback:')
        return _error_redirect('google_id_token_invalid')

    if idinfo is None:
        logger.error('Token verification returned None')
        return _error_redirect('google_id_token_invalid')

    # Validate issuer
    iss = idinfo.get('iss')
    if iss not in ('accounts.google.com', 'https://accounts.google.com'):
        logger.error('Invalid issuer: %s', iss)
        return _error_redirect('google_invalid_issuer')

    # Validate email_verified
    email_verified = idinfo.get('email_verified')
    if not email_verified:
        logger.error('Email not verified in Google account: %s', idinfo.get('email'))
        return _error_redirect('google_email_not_verified')

    google_sub = idinfo['sub']
    email = idinfo['email'].lower()

    # --- Link or create user ---
    user = None

    # 1) Match by google_sub
    try:
        user = User.objects.get(google_sub=google_sub)
    except User.DoesNotExist:
        pass

    if user is None:
        # 2) Match existing user by email if google_sub not yet set
        try:
            existing = User.objects.get(email=email)
            if existing.google_sub and existing.google_sub != google_sub:
                # Another Google account was already linked - reject
                logger.warning('Email %s already linked to a different google_sub', email)
                return _error_redirect('google_sub_mismatch')
            if not existing.is_active:
                logger.warning('Inactive account attempted Google link: %s', email)
                return _error_redirect('google_account_inactive')
            # Link this Google account to the existing Django user
            existing.google_sub = google_sub
            existing.is_verified = True
            existing.save(update_fields=['google_sub', 'is_verified'])
            user = existing
        except User.DoesNotExist:
            pass

    if user is None:
        # 3) Create brand-new user
        given = idinfo.get('given_name', '')
        family = idinfo.get('family_name', '')
        base_username = (given + family).lower().replace(' ', '') or email.split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f'{base_username}{counter}'
            counter += 1

        user = User(
            username=username,
            email=email,
            phone=None,
            google_sub=google_sub,
            is_verified=True,
            is_active=True,
        )
        user.set_unusable_password()
        user.save()
        logger.info('Created new Google user %s (%s)', username, email)

    if not user.is_active:
        return _error_redirect('google_account_inactive')

    # --- Django login + DRF token ---
    django_login(request, user, backend=_get_auth_backend())
    token, _ = Token.objects.get_or_create(user=user)

    # --- Store one-time handoff code in session ---
    handoff_code = secrets.token_urlsafe(48)
    request.session[_SK_HANDOFF] = hashlib.sha256(handoff_code.encode()).hexdigest()
    request.session[_SK_HANDOFF_UID] = user.pk
    request.session[_SK_HANDOFF_TS] = int(time.time())
    request.session[_SK_HANDOFF_NEXT] = next_path

    # Callback completed successfully; clear state/next markers.
    request.session.pop(_SK_STATE, None)
    request.session.pop(_SK_NEXT, None)

    # Redirect to SPA callback page with handoff code
    redirect_url = f'{frontend_base}/auth/google/callback?hcode={handoff_code}'
    return HttpResponseRedirect(redirect_url)


# ---------------------------------------------------------------------------
# 3) POST /api/auth/google/exchange/  { "code": "<handoff>" }
# ---------------------------------------------------------------------------
@ratelimit(key='ip', rate='10/h', method='POST')
@csrf_exempt
@require_POST
def google_auth_exchange(request):
    """Exchange the one-time handoff code for a DRF token + user payload."""
    logger.info('Google OAuth exchange request received: path=%s', request.path)
    logger.debug(
        'Google OAuth exchange session context: session_key=%s session_keys=%s',
        request.session.session_key,
        list(request.session.keys()),
    )
    try:
        body = _json.loads(request.body)
    except (_json.JSONDecodeError, ValueError):
        logger.warning('Google OAuth exchange rejected: invalid JSON body')
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    handoff_code = (body.get('code') or '').strip()
    if not handoff_code:
        return JsonResponse({'error': 'Missing code'}, status=400)

    # Retrieve and immediately clear session handoff data
    stored_hash = request.session.pop(_SK_HANDOFF, None)
    uid = request.session.pop(_SK_HANDOFF_UID, None)
    ts = request.session.pop(_SK_HANDOFF_TS, None)
    redirect_to = request.session.pop(_SK_HANDOFF_NEXT, '/')

    if not stored_hash or not uid or not ts:
        return JsonResponse({'error': 'Invalid or expired handoff code'}, status=400)

    # Verify code matches
    code_hash = hashlib.sha256(handoff_code.encode()).hexdigest()
    if code_hash != stored_hash:
        return JsonResponse({'error': 'Invalid handoff code'}, status=400)

    # Verify TTL
    if int(time.time()) - ts > HANDOFF_TTL_SECONDS:
        return JsonResponse({'error': 'Handoff code expired'}, status=400)

    # Retrieve user and token
    try:
        user = User.objects.get(pk=uid)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=400)

    token, _ = Token.objects.get_or_create(user=user)

    return JsonResponse({
        'status': 'success',
        'token': token.key,
        'user': {
            'id': user.pk,
            'username': user.username,
            'email': user.email,
        },
        'redirect_to': redirect_to,
    })
