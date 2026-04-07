import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { PerformanceProvider, usePerformance } from '@/context/PerformanceContext';
import SiteNav from '@/components/ui/SiteNav';
import { Footer } from '@/components/Footer';
import { CartPanel } from '@/components/CartPanel';
import { AuthModal } from '@/components/AuthModal';
import { OtpModal } from '@/components/OtpModal';
import { SearchOverlay } from '@/components/SearchOverlay';
import CustomCursor from '@/components/cursor/CustomCursor';
import PerformanceToggle from '@/components/PerformanceToggle';
import { Home } from '@/pages/Home';
import { Catalog } from '@/pages/Catalog';
import { ProductDetail } from '@/pages/ProductDetail';
import { Profile } from '@/pages/Profile';
import { GoogleAuthCallback } from '@/pages/GoogleAuthCallback';
import { TermsAndConditions } from '@/pages/TermsAndConditions';
import { PrivacyPolicy } from '@/pages/PrivacyPolicy';
import { About } from '@/pages/About';
import { Shipping } from '@/pages/Shipping';
import { Returns } from '@/pages/Returns';
import { Contact } from '@/pages/Contact';
import { Checkout } from '@/pages/Checkout';
import { OrderConfirmation } from '@/pages/OrderConfirmation';
import { Orders } from '@/pages/Orders';
import { OrderDetails } from '@/pages/OrderDetails';
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
  const { tier } = usePerformance();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isHome = pathname === '/';
  const appIsLoading = isHome ? false : isLoading;

  // Debug log for search state
  console.log('[App] isSearchOpen:', isSearchOpen, '| isHome:', isHome);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <CustomCursor key={tier} />
      <PerformanceToggle />
      <ScrollToTop />
      {/* All position:fixed elements live outside arc-dark-page so CSS transform
          on the page-enter animation never creates a new containing block for them */}
      {!isHome && (
        <SiteNav onSearchClick={() => setIsSearchOpen(true)} />
      )}
      <CartPanel />
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
            <Route path="/" element={<Home onSearchClick={() => setIsSearchOpen(true)} />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetails />} />
            <Route path="/auth/callback" element={<GoogleAuthCallback />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/about" element={<About />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/contact" element={<Contact />} />
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
      <PerformanceProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </PerformanceProvider>
    </BrowserRouter>
  );
}
