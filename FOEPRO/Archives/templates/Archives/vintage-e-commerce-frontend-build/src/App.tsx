import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import SiteNav from '@/components/ui/SiteNav';
import { Footer } from '@/components/Footer';
import { CartSlide } from '@/components/CartSlide';
import { AuthModal } from '@/components/AuthModal';
import { OtpModal } from '@/components/OtpModal';
import { SearchOverlay } from '@/components/SearchOverlay';
import CustomCursor from '@/components/cursor/CustomCursor';
import { Home } from '@/pages/Home';
import { Catalog } from '@/pages/Catalog';
import { ProductDetail } from '@/pages/ProductDetail';
import { Profile } from '@/pages/Profile';
import { GoogleAuthCallback } from '@/pages/GoogleAuthCallback';
import { TermsAndConditions } from '@/pages/TermsAndConditions';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { useState, useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
}

function AppContent() {
  const { pathname } = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isHome = pathname === '/';
  const appIsLoading = isHome ? false : isLoading;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <CustomCursor />
      <ScrollToTop />
      {/* All position:fixed elements live outside arc-dark-page so CSS transform
          on the page-enter animation never creates a new containing block for them */}
      {!isHome && (
        <SiteNav onSearchClick={() => setIsSearchOpen(true)} />
      )}
      <CartSlide />
      <AuthModal />
      <OtpModal />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <div
        className={`min-h-screen flex flex-col transition-opacity duration-700 ${
          isHome ? 'bg-transparent' : 'arc-dark-page'
        } ${appIsLoading ? 'opacity-0' : 'opacity-100'}`}
      >
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth/callback" element={<GoogleAuthCallback />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
          </Routes>
        </main>
        {!isHome && <Footer />}
      </div>
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
