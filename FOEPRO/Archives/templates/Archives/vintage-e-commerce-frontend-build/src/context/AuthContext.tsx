import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { apiFetch, apiUrl } from '@/lib/api';

interface User {
  email: string;
  name: string;
  savedItems: string[];
}

interface GoogleLoginResult {
  ok: boolean;
  message?: string;
  redirectTo?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signup: (username: string, email: string, phone: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ ok: boolean; message?: string }>;
  resendOtp: (email: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  toggleSavedItem: (productId: string) => void;
  isSaved: (productId: string) => boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isOtpModalOpen: boolean;
  setIsOtpModalOpen: (open: boolean) => void;
  pendingVerificationEmail: string | null;
  setPendingVerificationEmail: (email: string | null) => void;
  authModalMode: 'login' | 'signup';
  setAuthModalMode: (mode: 'login' | 'signup') => void;
  getAuthHeaders: () => Record<string, string>;
  startGoogleLogin: (nextPath?: string) => void;
  completeGoogleLogin: (code: string) => Promise<GoogleLoginResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('archives-user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('archives-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('archives-user');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<{ ok: boolean; message?: string }> => {
    // Call backend API for signin
    try {
      if (!email || !password) return { ok: false, message: 'Email and password are required' };
      const res = await apiFetch('/api/signin/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        const userObj = data.user || { email };
        const name = userObj.username || email.split('@')[0];
        const savedItems = JSON.parse(localStorage.getItem(`archives-saved-${email}`) || '[]');
        if (data.token) {
          localStorage.setItem('archives-token', data.token);
        }
        setUser({ email: userObj.email || email, name, savedItems });
        setIsAuthModalOpen(false);
        return { ok: true };
      }

      // Show backend detail only in development to aid debugging without leaking internals in production.
      const backendDetail = data?.detail || data?.error || data?.message;
      const safeMessage = import.meta.env.DEV
        ? (backendDetail || 'Server error')
        : (data?.message || 'Invalid credentials');
      return { ok: false, message: safeMessage };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '';
      return {
        ok: false,
        message: import.meta.env.DEV && errorMessage ? `Network error: ${errorMessage}` : 'Network error'
      };
    }
  };

  const signup = async (username: string, email: string, phone: string, password: string): Promise<{ ok: boolean; message?: string }> => {
    // Validate fields
    if (!username || !email || !phone || !password) return { ok: false, message: 'All fields are required' };
    if (password.length < 6) return { ok: false, message: 'Password must be at least 6 characters' };

    try {
      const res = await apiFetch('/api/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, phone, password })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        // Backend created user and sent OTP. Keep user pending verification and open OTP modal
        setIsAuthModalOpen(false);
        setPendingVerificationEmail(email);
        setIsOtpModalOpen(true);
        return { ok: true };
      }

      return { ok: false, message: data.message || 'Signup failed' };
    } catch (e) {
      return { ok: false, message: 'Network error' };
    }
  };

  // OTP / verification state
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  const verifyOtp = async (email: string, otp: string): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await apiFetch('/api/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        const userObj = data.user;
        const name = userObj.username || email.split('@')[0];
        const savedItems = JSON.parse(localStorage.getItem(`archives-saved-${email}`) || '[]');
        if (data.token) {
          localStorage.setItem('archives-token', data.token);
        }
        setUser({ email: userObj.email || email, name, savedItems });
        setIsOtpModalOpen(false);
        setPendingVerificationEmail(null);
        return { ok: true };
      }
      return { ok: false, message: data.message || 'Invalid OTP' };
    } catch (e) {
      return { ok: false, message: 'Network error' };
    }
  };

  const resendOtp = async (email: string): Promise<{ ok: boolean; message?: string }> => {
    try {
      const res = await apiFetch('/api/resend-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) return { ok: false, message: 'Failed' };
      const data = await res.json();
      return { ok: data.status === 'success', message: data.message };
    } catch (e) {
      return { ok: false, message: 'Network error' };
    }
  };

  const logout = async () => {
    if (user) {
      localStorage.setItem(`archives-saved-${user.email}`, JSON.stringify(user.savedItems));
    }
    try {
      await apiFetch('/api/logout/', { method: 'POST', headers: getAuthHeaders() });
    } catch {
      // Network error should not block local logout
    }
    localStorage.removeItem('archives-token');
    setUser(null);
  };

  const toggleSavedItem = (productId: string) => {
    if (!user) return;
    setUser(prev => {
      if (!prev) return prev;
      const savedItems = prev.savedItems.includes(productId)
        ? prev.savedItems.filter(id => id !== productId)
        : [...prev.savedItems, productId];
      return { ...prev, savedItems };
    });
  };

  const isSaved = (productId: string) => {
    return user?.savedItems.includes(productId) || false;
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('archives-token');
    if (token) {
      return { 'Authorization': `Token ${token}` };
    }
    return {};
  };

  const startGoogleLogin = (nextPath?: string) => {
    const next = nextPath || window.location.pathname;
    // Full-page redirect to Django endpoint which will redirect to Google
    window.location.href = apiUrl(`/api/auth/google/login/?next=${encodeURIComponent(next)}`);
  };

  const completeGoogleLogin = useCallback(async (code: string): Promise<GoogleLoginResult> => {
    try {
      const res = await apiFetch('/api/auth/google/exchange/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        const userObj = data.user || {};
        const email = userObj.email || '';
        const name = userObj.username || email.split('@')[0] || '';
        const savedItems = JSON.parse(localStorage.getItem(`archives-saved-${email}`) || '[]') as string[];
        const userData: User = { email, name, savedItems };
        if (data.token) {
          localStorage.setItem('archives-token', data.token);
        }
        localStorage.setItem('archives-user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthModalOpen(false);
        return { ok: true, redirectTo: data.redirect_to || '/profile' };
      }

      return { ok: false, message: data.error || data.message || 'Google sign-in failed' };
    } catch {
      return { ok: false, message: 'Network error during Google sign-in' };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAuthLoading,
        login,
        signup,
        verifyOtp,
        resendOtp,
        logout,
        toggleSavedItem,
        isSaved,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isOtpModalOpen,
        setIsOtpModalOpen,
        pendingVerificationEmail,
        setPendingVerificationEmail,
        authModalMode,
        setAuthModalMode,
        getAuthHeaders,
        startGoogleLogin,
        completeGoogleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
