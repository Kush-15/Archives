import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/** Map stable backend/Google error codes to human-readable messages. */
const ERROR_MESSAGES: Record<string, string> = {
  // Errors returned by Google itself
  access_denied: 'You cancelled the Google sign-in or denied access.',
  redirect_uri_mismatch:
    'Server configuration error: the redirect URI registered with Google does not match. Please contact support.',
  invalid_client:
    'Server configuration error: the Google client ID or secret is invalid. Please contact support.',

  // Errors detected by Django callback
  state_mismatch:
    'The sign-in session expired or was tampered with. Please try again.',
  google_no_code: 'Google did not return an authorization code. Please try again.',
  server_misconfigured:
    'Google sign-in is not configured on this server. Please contact support.',
  token_exchange_failed:
    'Failed to complete the sign-in with Google. Please try again in a moment.',
  google_no_id_token: 'Google did not return account information. Please try again.',
  google_id_token_invalid: 'Could not verify your Google account. Please try again.',
  google_invalid_issuer: 'The Google response could not be trusted. Please try again.',
  google_email_not_verified:
    'Your Google email address is not verified. Please verify it in your Google account settings and try again.',
  google_sub_mismatch:
    'This email is already linked to a different Google account. Please sign in with the original account or contact support.',
  google_account_inactive:
    'Your account has been deactivated. Please contact support.',
  google_error: 'An error occurred during Google sign-in. Please try again.',
};

function friendlyError(code: string): string {
  return ERROR_MESSAGES[code] || `Google sign-in failed: ${code.replace(/_/g, ' ')}`;
}

export function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeGoogleLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const exchangeAttempted = useRef(false);

  useEffect(() => {
    const code = searchParams.get('hcode');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(friendlyError(errorParam));
      return;
    }

    if (!code) {
      setError('Missing authorization code.');
      return;
    }

    const exchangeInFlightKey = `google_oauth_exchange_inflight:${code}`;
    const exchangeDoneKey = `google_oauth_exchange_done:${code}`;

    // React StrictMode remounts components in development, which can call this
    // effect twice and consume one-time handoff codes. Persist a guard so the
    // exchange runs only once per code.
    if (sessionStorage.getItem(exchangeDoneKey) === '1') {
      navigate('/profile', { replace: true });
      return;
    }

    if (sessionStorage.getItem(exchangeInFlightKey) === '1') {
      return;
    }

    if (exchangeAttempted.current) return;
    exchangeAttempted.current = true;
    sessionStorage.setItem(exchangeInFlightKey, '1');

    (async () => {
      try {
        const result = await completeGoogleLogin(code);
        if (result.ok) {
          sessionStorage.setItem(exchangeDoneKey, '1');
          navigate(result.redirectTo || '/profile', { replace: true });
        } else {
          sessionStorage.removeItem(exchangeInFlightKey);
          setError(result.message || 'Google sign-in failed.');
        }
      } catch {
        sessionStorage.removeItem(exchangeInFlightKey);
        setError('Network error during Google sign-in.');
      }
    })();
  }, [searchParams, completeGoogleLogin, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center arc-dark-page">
        <div className="max-w-md w-full bg-cream rounded-lg shadow-xl p-8 text-center">
          <h2 className="font-editorial text-2xl mb-4 text-archive-900">Sign-in Error</h2>
          <p className="text-archive-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-6 py-3 bg-archive-900 text-cream text-sm uppercase tracking-wider hover:bg-archive-800 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center arc-dark-page">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-archive-400 border-t-archive-900 rounded-full animate-spin mb-4" />
        <p className="text-archive-500 text-sm uppercase tracking-wider">Completing sign-in...</p>
      </div>
    </div>
  );
}
