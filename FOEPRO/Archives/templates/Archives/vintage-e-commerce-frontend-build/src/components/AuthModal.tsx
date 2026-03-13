import { useEffect, useState, useRef } from 'react';
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
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-archive-900/40 backdrop-blur-sm animate-fade-in"
        onClick={() => setIsAuthModalOpen(false)}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md bg-cream rounded-lg shadow-2xl animate-scale-in"
        role="dialog"
        aria-labelledby="auth-title"
      >
        {/* Close */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-archive-400 hover:text-archive-900 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 id="auth-title" className="font-editorial text-3xl mb-2">
              {authModalMode === 'login' ? 'Welcome Back' : 'Join The Archives'}
            </h2>
            <p className="text-archive-500">
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
                  <label htmlFor="username" className="block text-sm text-archive-600 mb-2">
                    Username (unique)
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setUsernameAvailable(null); }}
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
                      } catch (e) {
                        setUsernameAvailable(null);
                      } finally { setCheckingUsername(false); }
                    }}
                    className="w-full px-4 py-3 bg-white border border-archive-200 rounded focus:outline-none focus:border-archive-500 transition-colors"
                    placeholder="Choose a username"
                    required
                  />
                  {checkingUsername && <p className="text-sm text-archive-500 mt-1">Checking username...</p>}
                  {usernameAvailable === false && <p className="text-sm text-red-600 mt-1">Username is already taken</p>}
                  {usernameAvailable === true && <p className="text-sm text-green-600 mt-1">Username is available</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm text-archive-600 mb-2">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-archive-200 rounded focus:outline-none focus:border-archive-500 transition-colors"
                    placeholder="e.g. +15551234567"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm text-archive-600 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-archive-200 rounded focus:outline-none focus:border-archive-500 transition-colors"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-archive-600 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-archive-200 rounded focus:outline-none focus:border-archive-500 transition-colors"
                placeholder="Enter password (min 4 characters)"
                minLength={4}
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
              disabled={isLoading}
              className="w-full py-4 bg-archive-900 text-cream text-sm uppercase tracking-wider hover:bg-archive-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Please wait...' : authModalMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-archive-200" />
            <span className="px-4 text-archive-400 text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 border-t border-archive-200" />
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={() => {
              if (googleLoginInProgress.current) return;
              googleLoginInProgress.current = true;
              startGoogleLogin('/profile');
            }}
            className="w-full flex items-center justify-center gap-3 py-3 border border-archive-200 rounded hover:bg-archive-50 transition-colors"
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
            <span className="text-sm text-archive-700">Continue with Google</span>
          </button>

          {/* Switch Mode */}
          <p className="mt-6 text-center text-archive-500 text-sm">
            {authModalMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={switchMode}
              className="ml-1 text-archive-900 hover:underline"
            >
              {authModalMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
