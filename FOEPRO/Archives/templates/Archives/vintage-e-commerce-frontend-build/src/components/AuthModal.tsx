import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, authModalMode, setAuthModalMode, login, signup } = useAuth();
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
                        const res = await fetch('/api/check-username/', {
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
