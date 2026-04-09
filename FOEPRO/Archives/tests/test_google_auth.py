"""
Tests for Google OAuth 2.0 authentication flow.

Covers:
  - /api/auth/google/start/ and /api/auth/google/login/ redirect
  - /api/auth/google/callback/ with mocked Google token exchange
  - /api/auth/google/exchange/ handoff code exchange
  - Edge cases: invalid state, expired handoff, unverified email, existing email link, repeat login
  - Error handling: Google error param, HTTP failure on token exchange, invalid_client, redirect_uri_mismatch
  - Credential file loader: valid file, missing keys, env-var fallback, no credentials
"""

import hashlib
import json
import os
import tempfile
import time
from unittest.mock import patch, MagicMock

from django.core import signing
from django.test import TestCase, RequestFactory, override_settings
from django.contrib.sessions.backends.db import SessionStore
from django.core.exceptions import ImproperlyConfigured
from rest_framework.authtoken.models import Token

from Archives.models import User
from Archives.google_oauth import (
    google_auth_start,
    google_auth_callback,
    google_auth_exchange,
    _load_credentials,
    _clear_credentials_cache,
    _SK_STATE,
    _SK_NEXT,
    _SK_HANDOFF,
    _SK_HANDOFF_UID,
    _SK_HANDOFF_TS,
    _SK_HANDOFF_NEXT,
    HANDOFF_TTL_SECONDS,
    HANDOFF_SIG_SALT,
)


GOOGLE_SETTINGS = {
    'GOOGLE_CLIENT_ID': 'test-client-id.apps.googleusercontent.com',
    'GOOGLE_CLIENT_SECRET': 'test-client-secret',
    'GOOGLE_REDIRECT_URI': 'http://127.0.0.1:8000/api/auth/google/callback/',
    'FRONTEND_BASE_URL': 'http://127.0.0.1:3000',
}


def _make_request(factory, method, path, data=None, session=None):
    """Create a request with a working session."""
    if method == 'GET':
        request = factory.get(path, data or {})
    else:
        request = factory.post(path, json.dumps(data or {}), content_type='application/json')
    request.session = session or SessionStore()
    return request


def _fake_idinfo(sub='google-sub-123', email='test@example.com', email_verified=True):
    return {
        'sub': sub,
        'email': email,
        'email_verified': email_verified,
        'iss': 'accounts.google.com',
        'given_name': 'Test',
        'family_name': 'User',
    }


# ---------------------------------------------------------------------------
# Credential file loader tests
# ---------------------------------------------------------------------------
class CredentialLoaderTests(TestCase):
    def setUp(self):
        _clear_credentials_cache()

    def tearDown(self):
        _clear_credentials_cache()

    @override_settings(GOOGLE_CLIENT_ID='env-id', GOOGLE_CLIENT_SECRET='env-secret',
                       GOOGLE_REDIRECT_URI='http://127.0.0.1:8000/api/auth/google/callback/')
    @patch.dict(os.environ, {'GOOGLE_CREDENTIALS_FILE': ''}, clear=False)
    def test_falls_back_to_env_vars(self):
        """When no credentials file exists, falls back to settings env vars."""
        creds = _load_credentials()
        self.assertEqual(creds['client_id'], 'env-id')
        self.assertEqual(creds['client_secret'], 'env-secret')
        self.assertEqual(creds['redirect_uri'], 'http://127.0.0.1:8000/api/auth/google/callback/')

    @override_settings(GOOGLE_CLIENT_ID='', GOOGLE_CLIENT_SECRET='')
    @patch.dict(os.environ, {'GOOGLE_CREDENTIALS_FILE': ''}, clear=False)
    def test_raises_when_no_credentials(self):
        """Raises ImproperlyConfigured when no source provides credentials."""
        with self.assertRaises(ImproperlyConfigured):
            _load_credentials()

    @override_settings(GOOGLE_CLIENT_ID='', GOOGLE_CLIENT_SECRET='',
                       GOOGLE_REDIRECT_URI='http://127.0.0.1:8000/api/auth/google/callback/')
    def test_loads_from_json_file(self):
        """Reads client_id and client_secret from a JSON file."""
        cred_data = {
            'client_id': 'file-client-id',
            'client_secret': 'file-client-secret',
            'redirect_uri': 'http://127.0.0.1:8000/api/auth/google/callback/',
        }
        f = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        try:
            json.dump(cred_data, f)
            f.close()
            with patch.dict(os.environ, {'GOOGLE_CREDENTIALS_FILE': f.name}):
                creds = _load_credentials()
            self.assertEqual(creds['client_id'], 'file-client-id')
            self.assertEqual(creds['client_secret'], 'file-client-secret')
        finally:
            os.unlink(f.name)

    @override_settings(GOOGLE_CLIENT_ID='', GOOGLE_CLIENT_SECRET='',
                       GOOGLE_REDIRECT_URI='http://127.0.0.1:8000/api/auth/google/callback/')
    def test_loads_nested_web_format(self):
        """Supports Google Cloud Console download format with 'web' key."""
        cred_data = {
            'web': {
                'client_id': 'web-client-id',
                'client_secret': 'web-client-secret',
                'redirect_uris': ['http://127.0.0.1:8000/api/auth/google/callback/'],
            }
        }
        f = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        try:
            json.dump(cred_data, f)
            f.close()
            with patch.dict(os.environ, {'GOOGLE_CREDENTIALS_FILE': f.name}):
                creds = _load_credentials()
            self.assertEqual(creds['client_id'], 'web-client-id')
            self.assertEqual(creds['client_secret'], 'web-client-secret')
            self.assertEqual(creds['redirect_uri'], 'http://127.0.0.1:8000/api/auth/google/callback/')
        finally:
            os.unlink(f.name)

    @override_settings(GOOGLE_CLIENT_ID='', GOOGLE_CLIENT_SECRET='')
    def test_missing_keys_raises(self):
        """Raises ImproperlyConfigured if JSON file is missing required keys."""
        cred_data = {'client_id': 'only-id'}  # missing client_secret
        f = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        try:
            json.dump(cred_data, f)
            f.close()
            with patch.dict(os.environ, {'GOOGLE_CREDENTIALS_FILE': f.name}):
                with self.assertRaises(ImproperlyConfigured) as ctx:
                    _load_credentials()
                self.assertIn('client_secret', str(ctx.exception))
        finally:
            os.unlink(f.name)

    @override_settings(GOOGLE_CLIENT_ID='', GOOGLE_CLIENT_SECRET='')
    def test_invalid_json_raises(self):
        """Raises ImproperlyConfigured if the file is not valid JSON."""
        f = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        try:
            f.write('not valid json {{{')
            f.close()
            with patch.dict(os.environ, {'GOOGLE_CREDENTIALS_FILE': f.name}):
                with self.assertRaises(ImproperlyConfigured):
                    _load_credentials()
        finally:
            os.unlink(f.name)

    @override_settings(GOOGLE_CLIENT_ID='', GOOGLE_CLIENT_SECRET='',
                       GOOGLE_REDIRECT_URI='http://default-redirect/')
    def test_json_redirect_uri_overrides_env(self):
        """JSON redirect_uri takes precedence over settings.GOOGLE_REDIRECT_URI."""
        cred_data = {
            'client_id': 'id',
            'client_secret': 'secret',
            'redirect_uri': 'http://from-json/',
        }
        f = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
        try:
            json.dump(cred_data, f)
            f.close()
            with patch.dict(os.environ, {'GOOGLE_CREDENTIALS_FILE': f.name}):
                creds = _load_credentials()
            self.assertEqual(creds['redirect_uri'], 'http://from-json/')
        finally:
            os.unlink(f.name)


# ---------------------------------------------------------------------------
# Start endpoint tests
# ---------------------------------------------------------------------------
@override_settings(**GOOGLE_SETTINGS)
class GoogleAuthStartTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        _clear_credentials_cache()

    def tearDown(self):
        _clear_credentials_cache()

    def test_redirects_to_google(self):
        request = _make_request(self.factory, 'GET', '/api/auth/google/start/', {'next': '/catalog'})
        response = google_auth_start(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('accounts.google.com', response['Location'])
        self.assertIn('test-client-id', response['Location'])
        # State stored in session
        self.assertIn(_SK_STATE, request.session)
        self.assertEqual(request.session[_SK_NEXT], '/catalog')

    def test_login_alias_works(self):
        """GET /api/auth/google/login/ uses the same view."""
        request = _make_request(self.factory, 'GET', '/api/auth/google/login/', {'next': '/'})
        response = google_auth_start(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('accounts.google.com', response['Location'])

    def test_sanitizes_bad_next(self):
        request = _make_request(self.factory, 'GET', '/api/auth/google/start/', {'next': 'https://evil.com'})
        response = google_auth_start(request)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(request.session[_SK_NEXT], '/')

    @override_settings(GOOGLE_CLIENT_ID='', GOOGLE_CLIENT_SECRET='')
    def test_returns_503_when_not_configured(self):
        _clear_credentials_cache()
        request = _make_request(self.factory, 'GET', '/api/auth/google/start/')
        response = google_auth_start(request)
        self.assertEqual(response.status_code, 503)


# ---------------------------------------------------------------------------
# Callback endpoint tests
# ---------------------------------------------------------------------------
@override_settings(**GOOGLE_SETTINGS)
class GoogleAuthCallbackTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        _clear_credentials_cache()

    def tearDown(self):
        _clear_credentials_cache()

    @patch('Archives.google_oauth.google_id_token.verify_oauth2_token')
    @patch('Archives.google_oauth.requests.post')
    def test_creates_new_user(self, mock_post, mock_verify):
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = {'id_token': 'fake-token'}
        mock_post.return_value = mock_resp
        mock_verify.return_value = _fake_idinfo()

        session = SessionStore()
        session[_SK_STATE] = 'valid-state'
        session[_SK_NEXT] = '/profile'
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'code': 'auth-code', 'state': 'valid-state'},
            session=session,
        )
        response = google_auth_callback(request)

        self.assertEqual(response.status_code, 302)
        self.assertIn('/auth/google/callback?hcode=', response['Location'])

        # User created
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.google_sub, 'google-sub-123')
        self.assertTrue(user.is_verified)
        self.assertIsNone(user.phone)
        self.assertFalse(user.has_usable_password())

    @patch('Archives.google_oauth.google_id_token.verify_oauth2_token')
    @patch('Archives.google_oauth.requests.post')
    def test_links_existing_user_by_email(self, mock_post, mock_verify):
        existing = User(username='existing', email='test@example.com', phone='+1234567890')
        existing.set_password('password123')
        existing.is_verified = True
        existing.save()

        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = {'id_token': 'fake-token'}
        mock_post.return_value = mock_resp
        mock_verify.return_value = _fake_idinfo()

        session = SessionStore()
        session[_SK_STATE] = 'valid-state'
        session[_SK_NEXT] = '/'
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'code': 'auth-code', 'state': 'valid-state'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)

        existing.refresh_from_db()
        self.assertEqual(existing.google_sub, 'google-sub-123')

    @patch('Archives.google_oauth.google_id_token.verify_oauth2_token')
    @patch('Archives.google_oauth.requests.post')
    def test_repeat_login_with_existing_google_sub(self, mock_post, mock_verify):
        user = User(username='guser', email='test@example.com', google_sub='google-sub-123')
        user.set_unusable_password()
        user.is_verified = True
        user.save()

        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = {'id_token': 'fake-token'}
        mock_post.return_value = mock_resp
        mock_verify.return_value = _fake_idinfo()

        session = SessionStore()
        session[_SK_STATE] = 'valid-state'
        session[_SK_NEXT] = '/'
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'code': 'auth-code', 'state': 'valid-state'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('/auth/google/callback?hcode=', response['Location'])

    def test_invalid_state_redirects_with_error(self):
        session = SessionStore()
        session[_SK_STATE] = 'expected-state'
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'code': 'auth-code', 'state': 'wrong-state'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('error=state_mismatch', response['Location'])

    @patch('Archives.google_oauth.google_id_token.verify_oauth2_token')
    @patch('Archives.google_oauth.requests.post')
    def test_unverified_email_rejected(self, mock_post, mock_verify):
        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = {'id_token': 'fake-token'}
        mock_post.return_value = mock_resp
        mock_verify.return_value = _fake_idinfo(email_verified=False)

        session = SessionStore()
        session[_SK_STATE] = 'valid-state'
        session[_SK_NEXT] = '/'
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'code': 'auth-code', 'state': 'valid-state'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('error=google_email_not_verified', response['Location'])

    @patch('Archives.google_oauth.google_id_token.verify_oauth2_token')
    @patch('Archives.google_oauth.requests.post')
    def test_google_sub_mismatch_rejected(self, mock_post, mock_verify):
        """Email already linked to a different Google account."""
        User.objects.create(
            username='other', email='test@example.com',
            google_sub='different-google-sub', is_verified=True,
        )

        mock_resp = MagicMock()
        mock_resp.ok = True
        mock_resp.json.return_value = {'id_token': 'fake-token'}
        mock_post.return_value = mock_resp
        mock_verify.return_value = _fake_idinfo(sub='google-sub-123')

        session = SessionStore()
        session[_SK_STATE] = 'valid-state'
        session[_SK_NEXT] = '/'
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'code': 'auth-code', 'state': 'valid-state'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('error=google_sub_mismatch', response['Location'])

    # --- New error-handling tests ---

    def test_google_error_param_forwarded(self):
        """When Google redirects back with ?error=access_denied, we forward it."""
        session = SessionStore()
        session[_SK_STATE] = 'valid-state'
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'error': 'access_denied', 'state': 'valid-state'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('error=access_denied', response['Location'])

    def test_legacy_callback_alias_route(self):
        """Legacy /api/auth/callback/ route resolves to Google callback view."""
        response = self.client.get('/api/auth/callback/', {'error': 'access_denied'})
        self.assertEqual(response.status_code, 302)
        self.assertIn('error=access_denied', response['Location'])

    def test_google_redirect_uri_mismatch_error(self):
        """Maps Google's redirect_uri_mismatch error."""
        session = SessionStore()
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'error': 'redirect_uri_mismatch'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('error=redirect_uri_mismatch', response['Location'])

    def test_google_invalid_client_error(self):
        """Maps Google's invalid_client error."""
        session = SessionStore()
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'error': 'invalid_client'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('error=invalid_client', response['Location'])

    @patch('Archives.google_oauth.requests.post')
    def test_token_exchange_http_failure(self, mock_post):
        """When Google token endpoint returns non-200, maps to token_exchange_failed."""
        mock_resp = MagicMock()
        mock_resp.ok = False
        mock_resp.status_code = 400
        mock_resp.text = '{"error": "invalid_grant"}'
        mock_resp.json.return_value = {'error': 'invalid_grant'}
        mock_post.return_value = mock_resp

        session = SessionStore()
        session[_SK_STATE] = 'valid-state'
        session[_SK_NEXT] = '/'
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'code': 'auth-code', 'state': 'valid-state'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('error=token_exchange_failed', response['Location'])

    @patch('Archives.google_oauth.requests.post')
    def test_token_exchange_invalid_client_mapped(self, mock_post):
        """When Google token endpoint returns invalid_client, maps correctly."""
        mock_resp = MagicMock()
        mock_resp.ok = False
        mock_resp.status_code = 401
        mock_resp.text = '{"error": "invalid_client"}'
        mock_resp.json.return_value = {'error': 'invalid_client'}
        mock_post.return_value = mock_resp

        session = SessionStore()
        session[_SK_STATE] = 'valid-state'
        session[_SK_NEXT] = '/'
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'code': 'auth-code', 'state': 'valid-state'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('error=invalid_client', response['Location'])

    @patch('Archives.google_oauth.requests.post', side_effect=ConnectionError('network down'))
    def test_token_exchange_network_error(self, mock_post):
        """Network exception during token exchange maps to token_exchange_failed."""
        session = SessionStore()
        session[_SK_STATE] = 'valid-state'
        session[_SK_NEXT] = '/'
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'code': 'auth-code', 'state': 'valid-state'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('error=token_exchange_failed', response['Location'])

    def test_missing_code_returns_error(self):
        """No code param and no error param returns google_no_code."""
        session = SessionStore()
        session[_SK_STATE] = 'valid-state'
        session[_SK_NEXT] = '/'
        session.save()

        request = _make_request(
            self.factory, 'GET', '/api/auth/google/callback/',
            {'state': 'valid-state'},
            session=session,
        )
        response = google_auth_callback(request)
        self.assertEqual(response.status_code, 302)
        self.assertIn('error=google_no_code', response['Location'])


# ---------------------------------------------------------------------------
# Exchange endpoint tests
# ---------------------------------------------------------------------------
@override_settings(**GOOGLE_SETTINGS)
class GoogleAuthExchangeTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User(username='exchuser', email='exch@example.com', google_sub='g-sub')
        self.user.set_unusable_password()
        self.user.is_verified = True
        self.user.save()

    def _setup_session_with_handoff(self, code='valid-code', uid=None, ts=None):
        session = SessionStore()
        session[_SK_HANDOFF] = hashlib.sha256(code.encode()).hexdigest()
        session[_SK_HANDOFF_UID] = uid or self.user.pk
        session[_SK_HANDOFF_TS] = ts or int(time.time())
        session[_SK_HANDOFF_NEXT] = '/profile'
        session.save()
        return session

    def test_valid_exchange(self):
        session = self._setup_session_with_handoff()
        request = _make_request(
            self.factory, 'POST', '/api/auth/google/exchange/',
            {'code': 'valid-code'}, session=session,
        )
        response = google_auth_exchange(request)
        data = json.loads(response.content)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['user']['email'], 'exch@example.com')
        self.assertIn('token', data)
        self.assertEqual(data['redirect_to'], '/profile')

    def test_invalid_code(self):
        session = self._setup_session_with_handoff()
        request = _make_request(
            self.factory, 'POST', '/api/auth/google/exchange/',
            {'code': 'wrong-code'}, session=session,
        )
        response = google_auth_exchange(request)
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertIn('Invalid handoff code', data['error'])

    def test_expired_handoff(self):
        old_ts = int(time.time()) - HANDOFF_TTL_SECONDS - 10
        session = self._setup_session_with_handoff(ts=old_ts)
        request = _make_request(
            self.factory, 'POST', '/api/auth/google/exchange/',
            {'code': 'valid-code'}, session=session,
        )
        response = google_auth_exchange(request)
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertIn('expired', data['error'])

    def test_missing_session_data(self):
        session = SessionStore()
        session.save()
        request = _make_request(
            self.factory, 'POST', '/api/auth/google/exchange/',
            {'code': 'any-code'}, session=session,
        )
        response = google_auth_exchange(request)
        self.assertEqual(response.status_code, 400)

    def test_replay_attack_fails(self):
        """Using the same code twice should fail (session data cleared on first use)."""
        session = self._setup_session_with_handoff()
        request1 = _make_request(
            self.factory, 'POST', '/api/auth/google/exchange/',
            {'code': 'valid-code'}, session=session,
        )
        response1 = google_auth_exchange(request1)
        self.assertEqual(response1.status_code, 200)

        # Second attempt with same session
        request2 = _make_request(
            self.factory, 'POST', '/api/auth/google/exchange/',
            {'code': 'valid-code'}, session=session,
        )
        response2 = google_auth_exchange(request2)
        self.assertEqual(response2.status_code, 400)

    def test_signed_fallback_allows_exchange_when_session_data_missing(self):
        session = SessionStore()
        session.save()
        code = 'valid-code'
        sig = signing.dumps(
            {
                'uid': self.user.pk,
                'code_hash': hashlib.sha256(code.encode()).hexdigest(),
                'next': '/profile',
                'sk': session.session_key,
            },
            salt=HANDOFF_SIG_SALT,
        )
        request = _make_request(
            self.factory,
            'POST',
            '/api/auth/google/exchange/',
            {'code': code, 'sig': sig},
            session=session,
        )
        response = google_auth_exchange(request)
        data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['redirect_to'], '/profile')

    def test_signed_fallback_rejects_session_mismatch(self):
        session = SessionStore()
        session.save()
        code = 'valid-code'
        sig = signing.dumps(
            {
                'uid': self.user.pk,
                'code_hash': hashlib.sha256(code.encode()).hexdigest(),
                'next': '/profile',
                'sk': 'different-session-key',
            },
            salt=HANDOFF_SIG_SALT,
        )
        request = _make_request(
            self.factory,
            'POST',
            '/api/auth/google/exchange/',
            {'code': code, 'sig': sig},
            session=session,
        )
        response = google_auth_exchange(request)
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertIn('Invalid or expired handoff code', data['error'])
