import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';

export function CartSlide() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice } = useCart();
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCartOpen(false);
    };
    if (isCartOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isCartOpen, setIsCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[300]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 arc-glass-backdrop animate-fade-in"
        style={{ background: 'rgba(6, 6, 7, 0.86)' }}
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Slide Panel */}
      <div 
        ref={slideRef}
        className="absolute right-0 top-0 h-full w-full max-w-md arc-glass-panel shadow-2xl animate-slide-in flex flex-col"
        role="dialog"
        aria-label="Shopping cart"
        style={{ background: 'var(--arc-glass-strong)', color: 'var(--arc-text-light)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-archive-200" style={{ borderColor: 'var(--arc-border)' }}>
          <h2 className="font-display text-2xl" style={{ color: 'var(--arc-text-light)' }}>Your Selection</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-archive-600 hover:text-archive-900 transition-colors"
            style={{ color: 'var(--arc-text-muted)' }}
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 mb-6 text-archive-300" style={{ color: 'var(--arc-text-muted)' }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="font-display text-3xl text-archive-900 mb-2" style={{ color: 'var(--arc-text-light)' }}>Your collection is empty</p>
              <p className="text-archive-500 text-sm mb-6" style={{ color: 'var(--arc-text-body)' }}>Discover our curated artifacts</p>
              <Link
                to="/catalog"
                onClick={() => setIsCartOpen(false)}
                className="text-sm uppercase tracking-[0.18em] text-archive-900 border-b border-archive-900 pb-1 hover:text-archive-600 hover:border-archive-600 transition-colors"
                style={{ color: 'var(--arc-text-light)', borderColor: 'var(--arc-text-light)' }}
              >
                Browse Collection
              </Link>
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li key={item.product.id} className="flex gap-4 pb-6 border-b border-archive-200 last:border-0" style={{ borderColor: 'var(--arc-border)' }}>
                  {/* Image */}
                  <div className="w-20 h-20 bg-archive-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product.id}`}
                      onClick={() => setIsCartOpen(false)}
                      className="font-medium text-archive-900 hover:text-archive-600 transition-colors line-clamp-1"
                      style={{ color: 'var(--arc-text-light)' }}
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-archive-500 mt-1" style={{ color: 'var(--arc-text-body)' }}>{item.product.era}</p>
                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center border border-archive-300 rounded text-archive-600 hover:bg-archive-100 transition-colors"
                          style={{ borderColor: 'var(--arc-border-hover)', color: 'var(--arc-text-light)' }}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm" style={{ color: 'var(--arc-text-light)' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center border border-archive-300 rounded text-archive-600 hover:bg-archive-100 transition-colors"
                          style={{ borderColor: 'var(--arc-border-hover)', color: 'var(--arc-text-light)' }}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Price & Remove */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium" style={{ color: 'var(--arc-text-light)' }}>${(item.product.price * item.quantity).toLocaleString()}</span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-archive-400 hover:text-archive-900 transition-colors"
                          style={{ color: 'var(--arc-text-muted)' }}
                          aria-label="Remove item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-archive-200" style={{ background: 'rgba(25, 25, 24, 0.92)', borderColor: 'var(--arc-border)' }}>
            <div className="flex justify-between items-center mb-6">
              <span className="text-archive-600" style={{ color: 'var(--arc-text-body)' }}>Subtotal</span>
              <span className="font-display text-2xl" style={{ color: 'var(--arc-text-light)' }}>${totalPrice.toLocaleString()}</span>
            </div>
            <p className="text-xs text-archive-500 mb-4 text-center" style={{ color: 'var(--arc-text-muted)' }}>
              Shipping and authentication calculated at checkout
            </p>
            <button
              className="w-full py-4 text-cream text-sm uppercase tracking-wider transition-colors"
              style={{ background: 'var(--arc-indigo)' }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
