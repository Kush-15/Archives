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
          <h1 className="font-editorial text-3xl text-archive-900 mb-4">Sign In Required</h1>
          <p className="text-archive-500 mb-6">Please sign in to view your profile</p>
          <button
            onClick={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-archive-900 text-cream text-sm uppercase tracking-wider hover:bg-archive-800 transition-colors"
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
    <div className="pt-32 pb-20 min-h-screen">
      <div className="max-w-[1800px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-16">
          <p className="text-sm uppercase tracking-[0.3em] text-archive-500 mb-4 animate-slide-up">
            Your Account
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="font-display text-5xl md:text-6xl text-archive-900 animate-slide-up">
              Welcome, {user.name}
            </h1>
            <button
              onClick={handleLogout}
              className="animate-slide-up text-archive-500 hover:text-archive-900 transition-colors text-sm uppercase tracking-wider"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white rounded-lg p-8 animate-fade-in">
            <h2 className="text-sm uppercase tracking-wider text-archive-500 mb-4">Account Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-archive-400 mb-1">Name</p>
                <p className="text-archive-900">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-archive-400 mb-1">Email</p>
                <p className="text-archive-900">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-sm uppercase tracking-wider text-archive-500 mb-4">Collection Stats</h2>
            <div className="space-y-4">
              <div>
                <p className="font-editorial text-4xl text-archive-900">{savedProducts.length}</p>
                <p className="text-sm text-archive-500">Saved Items</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-sm uppercase tracking-wider text-archive-500 mb-4">Member Since</h2>
            <div>
              <p className="font-editorial text-4xl text-archive-900">2024</p>
              <p className="text-sm text-archive-500">Collector</p>
            </div>
          </div>
        </div>

        {/* Saved Items */}
        <section>
          <div className="flex items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-archive-500 mb-4">
                Your Saved Items
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-archive-900">
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
