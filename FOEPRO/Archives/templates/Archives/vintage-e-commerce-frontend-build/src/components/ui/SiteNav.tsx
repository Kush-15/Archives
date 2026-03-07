import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface SiteNavProps {
  onSearchClick?: () => void;
}

export default function SiteNav({ onSearchClick }: SiteNavProps = {}) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const { user, isLoggedIn, logout, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();

  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Home-specific staggered entrance (waits for CRT)
  useEffect(() => {
    if (!isHome) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    gsap.from('.arc-nav-link, .arc-nav-right', {
      y: -12, opacity: 0, duration: 0.7, stagger: 0.08,
      ease: 'power3.out', delay: 2.8,
    });
    gsap.from('.arc-nav-brand', {
      y: -12, opacity: 0, duration: 0.7,
      ease: 'power3.out', delay: 2.6,
    });
  }, [isHome]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleSignIn = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleRegister = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  const rawName = user ? (user.name || user.email) : '';
  const displayName = rawName.length > 14 ? rawName.slice(0, 14) + '…' : rawName;
  const initial = rawName ? rawName[0].toUpperCase() : '';

  const navClass = [
    'arc-nav',
    (scrolled || !isHome) ? 'arc-nav--scrolled' : '',
    !isHome ? 'arc-nav--page' : '',
  ].filter(Boolean).join(' ');

  return (
    <nav className={navClass}>
      {/* Brand */}
      <div className="arc-nav-brand">
        {isHome ? (
          <>
            <span className="arc-nav-brand-eyebrow">EST. 1972</span>
            <span className="arc-nav-brand-name">The Archives</span>
          </>
        ) : (
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span className="arc-nav-brand-eyebrow">EST. 1972</span>
            <span className="arc-nav-brand-name">The Archives</span>
          </Link>
        )}
      </div>

      {/* Centre links */}
      <div className="arc-nav-links">
        {isHome ? (
          <>
            <a href="#reveal" className="arc-nav-link">About</a>
            <a href="#collection" className="arc-nav-link">Collection</a>
            <a href="#craftsmanship" className="arc-nav-link">Craftsmanship</a>
            <a href="#archive" className="arc-nav-link">Archive</a>
          </>
        ) : (
          <>
            <Link to="/catalog" className="arc-nav-link">Collection</Link>
            <Link to="/profile" className="arc-nav-link">Account</Link>
          </>
        )}
      </div>

      {/* Right cluster: auth + cart + (CTA on home) */}
      <div className="arc-nav-right">
        {/* Search (non-home only) */}
        {!isHome && onSearchClick && (
          <button className="arc-nav-icon-btn" onClick={onSearchClick} aria-label="Search">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}

        {/* Auth state */}
        {isLoggedIn ? (
          <div className="arc-nav-profile" ref={dropdownRef}>
            <button
              className="arc-nav-avatar-btn"
              onClick={() => setDropdownOpen(v => !v)}
              aria-label="Account menu"
            >
              <span className="arc-nav-avatar">{initial}</span>
              <span className="arc-nav-user-name">{displayName}</span>
            </button>

            {dropdownOpen && (
              <div className="arc-nav-dropdown">
                <Link
                  to="/orders"
                  className="arc-nav-dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  My Orders
                </Link>
                <Link
                  to="/profile"
                  className="arc-nav-dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  Saved Items
                </Link>
                <button
                  className="arc-nav-dropdown-item arc-nav-dropdown-item--danger"
                  onClick={() => { logout(); setDropdownOpen(false); }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="arc-nav-auth">
            <button className="arc-nav-auth-link" onClick={handleSignIn}>Sign in</button>
            <button className="arc-nav-auth-link" onClick={handleRegister}>Register</button>
          </div>
        )}

        {/* Cart */}
        <button
          className="arc-nav-icon-btn arc-nav-cart-btn"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Cart: ${totalItems} items`}
        >
          <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {totalItems > 0 && (
            <span className="arc-nav-cart-badge">{totalItems}</span>
          )}
        </button>

        {/* Enter Shop CTA (home only) */}
        {isHome && (
          <a href="/catalog" className="arc-nav-cta">
            Enter the Shop →
          </a>
        )}
      </div>
    </nav>
  );
}
