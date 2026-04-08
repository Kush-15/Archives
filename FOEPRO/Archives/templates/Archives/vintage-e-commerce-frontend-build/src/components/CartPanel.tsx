import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { usePerformance } from '@/context/PerformanceContext';

export function CartPanel() {
  const { tier } = usePerformance();
  const { items, isOpen, closeCart, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { isLoggedIn, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const navigate = useNavigate();

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeCart]);

  // Lock body scroll and add body class when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('cart-panel-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('cart-panel-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('cart-panel-open');
    };
  }, [isOpen]);

  const handleCheckout = () => {
    closeCart();
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    navigate('/checkout');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on backdrop
    if (e.target === e.currentTarget) {
      closeCart();
    }
  };

  if (!isOpen) return null;

  const cartContent = (
    <>
      {/* Backdrop */}
      <div 
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: tier === 'low' ? 'none' : 'blur(4px)',
          zIndex: 119998,
          opacity: 1,
          pointerEvents: 'auto',
          transition: 'opacity 0.3s ease',
          cursor: 'pointer',
        }}
      />
      
      {/* Cart Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#0a0a0a',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          zIndex: 119999,
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateX(0)',
          transition: 'transform 0.3s ease',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
        }}
        aria-modal="true"
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 600, margin: 0 }}>
            Your Cart ({items.length})
          </h2>
          <button
            onClick={closeCart}
            data-cursor="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'auto',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'white'}
            onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
            aria-label="Close cart"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          pointerEvents: 'auto',
        }}>
          {items.length === 0 ? (
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              textAlign: 'center',
            }}>
              <svg width="64" height="64" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p style={{ color: 'white', fontSize: '20px', marginTop: '16px' }}>Your cart is empty</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '8px' }}>Add some items to get started</p>
              <Link
                to="/catalog"
                onClick={closeCart}
                data-cursor="button"
                style={{
                  marginTop: '24px',
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: 'black',
                  textDecoration: 'none',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}
              >
                Browse Collection
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {items.map((item) => (
                <div 
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                  }}
                >
                  {/* Image */}
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }}>
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      to={`/product/${item.product.id}`}
                      onClick={closeCart}
                      data-cursor="pill"
                      style={{
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: 500,
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                      }}
                    >
                      {item.product.name}
                    </Link>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '4px' }}>
                      {item.product.era}
                    </p>
                    
                    {/* Quantity & Price */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginTop: '12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          data-cursor="button"
                          style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '4px',
                            background: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                          }}
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span style={{ color: 'white', width: '32px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          data-cursor="button"
                          style={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '4px',
                            background: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            pointerEvents: 'auto',
                          }}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: 'white', fontWeight: 500 }}>
                          ${(item.product.price * item.quantity).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          data-cursor="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            cursor: 'pointer',
                            padding: '4px',
                            pointerEvents: 'auto',
                          }}
                          aria-label="Remove from cart"
                        >
                          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: '24px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(0,0,0,0.5)',
            pointerEvents: 'auto',
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Subtotal</span>
              <span style={{ color: 'white', fontSize: '24px', fontWeight: 600 }}>
                ${totalPrice.toLocaleString()}
              </span>
            </div>
            <p style={{ 
              color: 'rgba(255,255,255,0.4)', 
              fontSize: '12px', 
              textAlign: 'center',
              marginBottom: '16px',
            }}>
              Shipping calculated at checkout
            </p>
            <button
              onClick={handleCheckout}
              data-cursor="button"
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#5C6EFF',
                color: 'white',
                border: 'none',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
              aria-label="Proceed to checkout"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(cartContent, document.body);
}
