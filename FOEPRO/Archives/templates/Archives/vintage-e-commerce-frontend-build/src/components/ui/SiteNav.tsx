import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import ScrambleText from '@/components/ui/ScrambleText';

interface SiteNavProps {
  onSearchClick?: () => void;
}

export default function SiteNav({ onSearchClick }: SiteNavProps = {}) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const { user, isLoggedIn, logout, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();

  const [scrolled, setScrolled]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen]        = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navLinksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ─── Home: staggered entrance with per-element precision ──────
  useEffect(() => {
    if (!isHome) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Brand slides in first
    gsap.fromTo('.arc-nav-brand',
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power4.out', delay: 2.6 }
    );
    // Each nav link staggers in with clip-path reveal
    gsap.fromTo('.arc-nav-link',
      { y: -20, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
      { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)', duration: 0.7, stagger: 0.09, ease: 'power4.out', delay: 2.8 }
    );
    // Right cluster fades up last
    gsap.fromTo('.arc-nav-right > *',
      { y: -12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'power3.out', delay: 3.1 }
    );
  }, [isHome]);

  // ─── Non-home: entrance on mount ─────────────────────────────
  useEffect(() => {
    if (isHome) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    gsap.fromTo('.arc-nav-brand, .arc-nav-link, .arc-nav-right > *',
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, stagger: 0.05, ease: 'power3.out', delay: 0.1 }
    );
  }, [isHome]);

  // ─── Close dropdown on outside click ────────────────────────
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

  const handleSignIn   = () => { setAuthModalMode('login');  setIsAuthModalOpen(true); };
  const handleRegister = () => { setAuthModalMode('signup'); setIsAuthModalOpen(true); };

  const rawName     = user ? (user.name || user.email) : '';
  const displayName = rawName.length > 14 ? rawName.slice(0, 14) + '…' : rawName;
  const initial     = rawName ? rawName[0].toUpperCase() : '';

  const navClass = [
    'arc-nav',
    (scrolled || !isHome) ? 'arc-nav--scrolled' : '',
    !isHome  ? 'arc-nav--page' : '',
    menuOpen ? 'arc-nav--menu-open' : '',
  ].filter(Boolean).join(' ');

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <nav className={navClass}>
      {/* ── Brand ── */}
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

      {/* ── Centre links ── */}
      <div className="arc-nav-links" ref={navLinksRef}>
        {isHome ? (
          <>
            <a href="#reveal"        className="arc-nav-link"><ScrambleText text="About" /></a>
            <a href="#collection"    className="arc-nav-link"><ScrambleText text="Collection" /></a>
            <a href="#craftsmanship" className="arc-nav-link"><ScrambleText text="Craftsmanship" /></a>
            <a href="#archive"       className="arc-nav-link"><ScrambleText text="Archive" /></a>
          </>
        ) : (
          <>
            <Link
              to="/catalog"
              className={`arc-nav-link ${isActivePath('/catalog') ? 'arc-nav-link--active' : ''}`}
            >
              <ScrambleText text="Collection" />
            </Link>
            <Link
              to="/profile"
              className={`arc-nav-link ${isActivePath('/profile') ? 'arc-nav-link--active' : ''}`}
            >
              <ScrambleText text="Account" />
            </Link>
          </>
        )}
      </div>

      {/* ── Right cluster ── */}
      <div className="arc-nav-right">
        {/* Search */}
        {!isHome && onSearchClick && (
          <button
            className="arc-nav-icon-btn"
            onClick={onSearchClick}
            aria-label="Search"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}

        {/* Auth */}
        {isLoggedIn ? (
          <div className="arc-nav-profile" ref={dropdownRef}>
            <button
              className="arc-nav-avatar-btn"
              onClick={() => setDropdownOpen(v => !v)}
              aria-label="Account menu"
              aria-expanded={dropdownOpen}
            >
              <span className="arc-nav-avatar">{initial}</span>
              <span className="arc-nav-user-name">{displayName}</span>
              <svg
                className={`arc-nav-chevron ${dropdownOpen ? 'arc-nav-chevron--open' : ''}`}
                width="8" height="8" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="arc-nav-dropdown">
                <Link to="/orders"  className="arc-nav-dropdown-item" onClick={() => setDropdownOpen(false)}>My Orders</Link>
                <Link to="/profile" className="arc-nav-dropdown-item" onClick={() => setDropdownOpen(false)}>Saved Items</Link>
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
            <span className="arc-nav-auth-divider" aria-hidden="true" />
            <button className="arc-nav-auth-link" onClick={handleRegister}>Register</button>
          </div>
        )}

        {/* Cart */}
        <button
          className="arc-nav-icon-btn arc-nav-cart-btn"
          onClick={() => setIsCartOpen(true)}
          aria-label={`Cart: ${totalItems} items`}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {totalItems > 0 && (
            <span className="arc-nav-cart-badge">{totalItems}</span>
          )}
        </button>

        {/* Enter Shop CTA (home only) — magnetic cursor target */}
        {isHome && (
          <a
            href="/catalog"
            className="arc-nav-cta"
            data-cursor="magnetic"
            data-cursor-label="ENTER"
          >
            <span className="arc-nav-cta-text">Enter the Shop</span>
            <span className="arc-nav-cta-arrow">→</span>
          </a>
        )}

        {/* Mobile menu toggle */}
        <button
          className="arc-nav-hamburger"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className={`arc-nav-hamburger-bar ${menuOpen ? 'arc-nav-hamburger-bar--open-top' : ''}`} />
          <span className={`arc-nav-hamburger-bar ${menuOpen ? 'arc-nav-hamburger-bar--open-mid' : ''}`} />
          <span className={`arc-nav-hamburger-bar ${menuOpen ? 'arc-nav-hamburger-bar--open-bot' : ''}`} />
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div className="arc-nav-mobile-drawer" role="dialog" aria-label="Navigation menu">
          <div className="arc-nav-mobile-links">
            {isHome ? (
              <>
                <a href="#reveal"        className="arc-nav-mobile-link" onClick={() => setMenuOpen(false)}>About</a>
                <a href="#collection"    className="arc-nav-mobile-link" onClick={() => setMenuOpen(false)}>Collection</a>
                <a href="#craftsmanship" className="arc-nav-mobile-link" onClick={() => setMenuOpen(false)}>Craftsmanship</a>
                <a href="#archive"       className="arc-nav-mobile-link" onClick={() => setMenuOpen(false)}>Archive</a>
                <a href="/catalog"       className="arc-nav-mobile-link arc-nav-mobile-link--cta" onClick={() => setMenuOpen(false)}>Enter the Shop →</a>
              </>
            ) : (
              <>
                <Link to="/catalog" className="arc-nav-mobile-link" onClick={() => setMenuOpen(false)}>Collection</Link>
                <Link to="/profile" className="arc-nav-mobile-link" onClick={() => setMenuOpen(false)}>Account</Link>
                {!isLoggedIn && (
                  <>
                    <button className="arc-nav-mobile-link" onClick={() => { handleSignIn(); setMenuOpen(false); }}>Sign In</button>
                    <button className="arc-nav-mobile-link" onClick={() => { handleRegister(); setMenuOpen(false); }}>Register</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
