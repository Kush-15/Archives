import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalMode, setAuthModalMode, login, signup, startGoogleLogin } = useAuth();
  const googleLoginInProgress = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAuthModalOpen(false);
    };
    if (isAuthModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('auth-modal-open');

      // hide elements with extreme z-index (defensive workaround)
      const cols = Array.from(document.querySelectorAll<HTMLElement>('*'));
      const toHide: HTMLElement[] = [];
      cols.forEach(el => {
        const z = parseInt(getComputedStyle(el).zIndex || '', 10);
        const isCursor = el.id === 'custom-cursor-layer' || el.closest('#custom-cursor-layer');
        if (!isNaN(z) && z >= 2147483647 && !isCursor) {
          toHide.push(el);
          // mark and hide
          el.setAttribute('data-hidden-by-modal', 'true');
          el.style.setProperty('display', 'none', 'important');
        }
      });
      hiddenByModalRef.current = toHide;
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      document.body.classList.remove('auth-modal-open');
      // restore hidden elements
      hiddenByModalRef.current.forEach(el => {
        if (el.getAttribute('data-hidden-by-modal') === 'true') {
          el.removeAttribute('data-hidden-by-modal');
          el.style.removeProperty('display');
        }
      });
      hiddenByModalRef.current = [];
    };
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  // Focus management: focus the first input when modal opens, restore focus on close
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const hiddenByModalRef = useRef<HTMLElement[]>([]);
  useEffect(() => {
    if (isAuthModalOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus first input after a tick to allow render
      requestAnimationFrame(() => {
        const firstInput = document.querySelector<HTMLInputElement>('.auth-panel input');
        firstInput?.focus();
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isAuthModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (checkingUsername) {
      setError('Please wait — checking username availability.');
      return;
    }
    setIsLoading(true);

    try {
      setError('');
      if (authModalMode === 'login') {
        const res = await login(email, password);
        if (!res.ok) setError(res.message || 'Please check your credentials and try again.');
      } else {
        // Signup flow: require username, phone and minimum password len
        if (!username) {
          setError('Username is required');
        } else if (!phone) {
          setError('Phone number is required');
        } else if (password.length < 6) {
          setError('Password must be at least 6 characters');
        } else if (usernameAvailable === false) {
          setError('Username is already taken');
        } else {
          const res = await signup(username, email, phone, password);
          if (!res.ok) setError(res.message || 'Please check your credentials and try again.');
          else {
            // signup success -> OTP modal will open (handled in context)
          }
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setAuthModalMode(authModalMode === 'login' ? 'signup' : 'login');
    setError('');
  };

  const isSignup = authModalMode === 'signup';

  if (!isAuthModalOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 999999 }}>
      {/* Backdrop */}
      <div
        className="auth-overlay absolute inset-0 animate-fade-in"
        onClick={() => setIsAuthModalOpen(false)}
      />

      {/* Modal */}
      <div
        className={`auth-panel relative w-full max-w-md rounded-lg animate-scale-in ${isSignup ? 'auth-panel--signup' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        {/* Close */}
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(false)}
          className="auth-close absolute top-4 right-4 p-2 z-10 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative p-6">
          {/* Header */}
          <div className="text-center mb-5">
            <p className="auth-kicker mb-4">The Archives Account</p>
            <h2 id="auth-title" className="auth-title mb-3">
              {authModalMode === 'login' ? 'Welcome Back' : 'Join The Archives'}
            </h2>
            <p className="auth-copy">
              {authModalMode === 'login'
                ? 'Sign in to access your collection'
                : 'Create an account to start collecting'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {authModalMode === 'signup' && (
              <>
                <div>
                  <label htmlFor="username" className="auth-label block mb-2">
                    Username (unique)
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameAvailable(null);
                    }}
                    onBlur={async () => {
                      const u = username.trim();
                      if (!u) return;
                      setCheckingUsername(true);
                      try {
                        const res = await apiFetch('/api/check-username/', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u })
                        });
                        const data = await res.json();
                        setUsernameAvailable(!!data.available);
                      } catch {
                        setUsernameAvailable(null);
                      } finally {
                        setCheckingUsername(false);
                      }
                    }}
                    className="auth-input px-4 py-3"
                    placeholder="Choose a username"
                    required
                  />
                  {checkingUsername && <p className="auth-copy mt-2">Checking username...</p>}
                  {usernameAvailable === false && <p className="text-sm text-red-600 mt-1">Username is already taken</p>}
                  {usernameAvailable === true && <p className="text-sm text-green-600 mt-1">Username is available</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="auth-label block mb-2">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="auth-input px-4 py-3"
                    placeholder="e.g. +15551234567"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="auth-label block mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input px-4 py-3"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="auth-label block mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input px-4 py-3"
                placeholder="Password (min 6 characters)"
                minLength={6}
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || checkingUsername}
              className="auth-primary w-full py-4 text-sm uppercase tracking-[0.22em] disabled:opacity-50"
            >
              {isLoading ? 'Please wait...' : authModalMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="auth-divider flex-1 border-t" />
            <span className="px-4 auth-kicker">or</span>
            <div className="auth-divider flex-1 border-t" />
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={() => {
              if (googleLoginInProgress.current) return;
              googleLoginInProgress.current = true;
              startGoogleLogin('/profile');
            }}
            className="auth-secondary w-full flex items-center justify-center gap-3 py-3 rounded"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-sm">Continue with Google</span>
          </button>

          {/* Switch Mode */}
          <p className="auth-copy mt-6 text-center">
            {authModalMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={switchMode}
              className="auth-link ml-1"
            >
              {authModalMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
