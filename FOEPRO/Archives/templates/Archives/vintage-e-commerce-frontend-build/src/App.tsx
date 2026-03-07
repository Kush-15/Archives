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
    <div
      className={`min-h-screen flex flex-col transition-opacity duration-700 ${
        isHome ? 'bg-transparent' : 'arc-dark-page'
      } ${appIsLoading ? 'opacity-0' : 'opacity-100'}`}
    >
      <CustomCursor />
      <ScrollToTop />
      {/* SiteNav renders on all pages; it self-adapts via useLocation */}
      {!isHome && (
        <SiteNav onSearchClick={() => setIsSearchOpen(true)} />
      )}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      {!isHome && <Footer />}
      <CartSlide />
      <AuthModal />
      <OtpModal />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
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
