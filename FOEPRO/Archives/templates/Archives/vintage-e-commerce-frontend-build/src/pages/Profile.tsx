import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { products } from '@/data/products';
import { ProductCard } from '@/components/ProductCard';

export function Profile() {
  const { user, isLoggedIn, logout, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
    }
  }, [isLoggedIn, setIsAuthModalOpen, setAuthModalMode]);

  if (!isLoggedIn || !user) {
    return (
      <div className="pt-32 pb-20 min-h-screen">
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 text-center">
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--arc-text-light)', marginBottom: '1rem' }}>Sign In Required</h1>
          <p style={{ color: 'var(--arc-text-muted)', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.08em' }}>Please sign in to view your profile</p>
          <button
            onClick={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#fff', background: 'var(--arc-indigo)', padding: '0.9rem 2rem', border: 'none', cursor: 'pointer', textDecoration: 'none', transition: 'opacity 0.2s ease' }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const savedProducts = products.filter(p => user.savedItems.includes(p.id));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16" style={{ borderBottom: '1px solid var(--arc-border)', paddingBottom: '2.5rem' }}>
          <p className="arc-page-eyebrow">Your Account</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="arc-page-title animate-slide-up">
              Welcome, {user.name}
            </h1>
            <button
              onClick={handleLogout}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--arc-text-light)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--arc-text-muted)')}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div style={{ background: 'var(--arc-card)', padding: '2rem', border: '1px solid var(--arc-border)' }} className="animate-fade-in">
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', marginBottom: '1.5rem' }}>Account Details</h2>
            <div className="space-y-4">
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', marginBottom: '0.35rem' }}>Name</p>
                <p style={{ color: 'var(--arc-text-light)' }}>{user.name}</p>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.52rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', marginBottom: '0.35rem' }}>Email</p>
                <p style={{ color: 'var(--arc-text-body)' }}>{user.email}</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--arc-card)', padding: '2rem', border: '1px solid var(--arc-border)', animationDelay: '0.1s' }} className="animate-fade-in">
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', marginBottom: '1.5rem' }}>Collection Stats</h2>
            <div className="space-y-4">
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', lineHeight: '1', color: 'var(--arc-text-light)' }}>{savedProducts.length}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', marginTop: '0.5rem' }}>Saved Items</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--arc-card)', padding: '2rem', border: '1px solid var(--arc-border)', animationDelay: '0.2s' }} className="animate-fade-in">
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', marginBottom: '1.5rem' }}>Member Since</h2>
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '3.5rem', lineHeight: '1', color: 'var(--arc-text-light)' }}>2024</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--arc-text-muted)', marginTop: '0.5rem' }}>Collector</p>
            </div>
          </div>
        </div>

        {/* Saved Items */}
        <section>
          <div className="flex items-end justify-between gap-6 mb-12">
            <div>
              <p className="arc-page-eyebrow" style={{ marginBottom: '0.75rem' }}>
                Your Saved Items
              </p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', lineHeight: '0.95', letterSpacing: '-0.02em', color: 'var(--arc-text-light)' }}>
                Curated Selection
              </h2>
            </div>
            {savedProducts.length > 0 && (
              <Link
                to="/catalog"
                className="hidden md:inline-flex items-center gap-2 text-archive-600 hover:text-archive-900 transition-colors group"
              >
                <span className="text-sm uppercase tracking-wider">Explore More</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            )}
          </div>

          {savedProducts.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-lg">
              <div className="w-16 h-16 mx-auto mb-6 text-archive-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="font-editorial text-xl text-archive-600 mb-2">No saved items yet</p>
              <p className="text-archive-500 text-sm mb-6">Start building your collection</p>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-archive-900 border-b border-archive-900 pb-1 hover:text-archive-600 hover:border-archive-600 transition-colors"
              >
                Browse Collection
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {savedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={product} variant="compact" />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
