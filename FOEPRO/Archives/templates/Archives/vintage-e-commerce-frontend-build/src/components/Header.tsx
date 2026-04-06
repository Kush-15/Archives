import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

interface HeaderProps {
  onSearchClick: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
  const { totalItems, setIsCartOpen } = useCart();
  const { isLoggedIn, logout, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthClick = () => {
    if (isLoggedIn) {
      return;
    }
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-[var(--ease-expo)] ${
        isScrolled ? 'glass py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="font-editorial text-2xl md:text-3xl tracking-tight text-archive-900 hover:text-archive-600 transition-colors duration-500"
        >
          The Archives
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-12">
          <Link
            to="/catalog"
            className={`text-sm tracking-wide uppercase relative group ${
              location.pathname === '/catalog' ? 'text-archive-900' : 'text-archive-600'
            }`}
          >
            Collection
            <span className={`absolute -bottom-1 left-0 h-px bg-archive-900 transition-all duration-500 ease-[var(--ease-expo)] ${
              location.pathname === '/catalog' ? 'w-full' : 'w-0 group-hover:w-full'
            }`} />
          </Link>
          <button
            onClick={onSearchClick}
            className="text-sm tracking-wide uppercase text-archive-600 hover:text-archive-900 transition-colors duration-300"
            aria-label="Search"
          >
            Search
          </button>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-6">
          {/* Mobile Search */}
          <button
            onClick={onSearchClick}
            className="md:hidden p-2 text-archive-700 hover:text-archive-900 transition-colors"
            aria-label="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Auth */}
          {isLoggedIn ? (
            <Link
              to="/profile"
              className="p-2 text-archive-700 hover:text-archive-900 transition-colors"
              aria-label="Profile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          ) : (
            <button
              onClick={handleAuthClick}
              className="hidden md:block text-sm tracking-wide uppercase text-archive-600 hover:text-archive-900 transition-colors duration-300"
            >
              Sign In
            </button>
          )}

          {/* Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-archive-700 hover:text-archive-900 transition-colors"
            aria-label={`Cart with ${totalItems} items`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-archive-900 text-cream text-xs flex items-center justify-center rounded-full animate-scale-in">
                {totalItems}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-archive-700 hover:text-archive-900 transition-colors"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-[var(--ease-expo)] ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="glass border-t border-archive-200/50 px-6 py-6 flex flex-col gap-4">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-sm tracking-wide uppercase py-2 transition-colors duration-300 ${
              location.pathname === '/' ? 'text-archive-900' : 'text-archive-600 hover:text-archive-900'
            }`}
          >
            Home
          </Link>
          <Link
            to="/catalog"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-sm tracking-wide uppercase py-2 transition-colors duration-300 ${
              location.pathname === '/catalog' ? 'text-archive-900' : 'text-archive-600 hover:text-archive-900'
            }`}
          >
            Catalog
          </Link>
          {isLoggedIn && (
            <>
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm tracking-wide uppercase py-2 transition-colors duration-300 ${
                  location.pathname === '/profile' ? 'text-archive-900' : 'text-archive-600 hover:text-archive-900'
                }`}
              >
                Profile
              </Link>
              <Link
                to="/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm tracking-wide uppercase py-2 transition-colors duration-300 ${
                  location.pathname === '/orders' ? 'text-archive-900' : 'text-archive-600 hover:text-archive-900'
                }`}
              >
                Orders
              </Link>
            </>
          )}
          <div className="border-t border-archive-200/50 pt-4 mt-2">
            {isLoggedIn ? (
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="text-sm tracking-wide uppercase text-archive-600 hover:text-archive-900 transition-colors duration-300"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="text-sm tracking-wide uppercase text-archive-600 hover:text-archive-900 transition-colors duration-300"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
