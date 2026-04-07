import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { products, Product } from '@/data/products';
import { usePerformance } from '@/context/PerformanceContext';

/* ═══════════════════════════════════════════════════════════
   THE ARCHIVES — Search Overlay (REWRITTEN FROM SCRATCH)
   100% functional search with tier-aware styling
   ═══════════════════════════════════════════════════════════ */

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const { tier } = usePerformance();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug log
  console.log('[SearchOverlay] isOpen:', isOpen);

  // Focus input when opened and manage body scroll/class
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('search-overlay-open');
    } else {
      // Reset state when closed
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      document.body.style.overflow = '';
      document.body.classList.remove('search-overlay-open');
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('search-overlay-open');
    };
  }, [isOpen]);

  // Search products
  useEffect(() => {
    if (query.trim().length > 0) {
      const searchTerms = query.toLowerCase().trim().split(/\s+/);
      const filtered = products.filter(product => {
        const searchableText = [
          product.name,
          product.description,
          product.tagline,
          product.category,
          product.era,
          product.year.toString(),
        ].join(' ').toLowerCase();
        
        return searchTerms.every(term => searchableText.includes(term));
      });
      
      setResults(filtered);
      setSelectedIndex(0);
    } else {
      setResults([]);
      setSelectedIndex(0);
    }
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length > 0) {
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        navigate(`/product/${results[selectedIndex].id}`);
        onClose();
      }
    }
  };

  // Auto-scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && results.length > 0) {
      const element = document.querySelector(`[data-search-result-index="${selectedIndex}"]`);
      if (element) {
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, results]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Tier-aware blur
  const blurAmount = tier === 'low' ? 'none' : tier === 'medium' ? 'blur(8px)' : 'blur(12px)';

  const searchContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 120000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '80px',
        pointerEvents: 'auto',
      }}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-label="Search"
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: blurAmount,
          WebkitBackdropFilter: blurAmount,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Search Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '700px',
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div style={{ position: 'relative' }}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search the archives..."
            autoComplete="off"
            spellCheck="false"
            style={{
              width: '100%',
              padding: '20px 60px 20px 24px',
              fontSize: '18px',
              fontWeight: 300,
              color: '#FFFFFF',
              backgroundColor: 'rgba(20, 20, 20, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              outline: 'none',
              backdropFilter: tier === 'low' ? 'none' : 'blur(16px)',
              WebkitBackdropFilter: tier === 'low' ? 'none' : 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              transition: 'border-color 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Close search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results Container */}
        {query.trim().length > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(20, 20, 20, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              backdropFilter: tier === 'low' ? 'none' : 'blur(16px)',
              WebkitBackdropFilter: tier === 'low' ? 'none' : 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
          >
            {results.length === 0 ? (
              // No Results
              <div
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                  No artifacts found for "{query}"
                </p>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.3)' }}>
                  Try searching for a category, era, or product name
                </p>
              </div>
            ) : (
              // Results List
              <div>
                {results.map((product, index) => {
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={onClose}
                      data-search-result-index={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        borderBottom: index < results.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {/* Product Image */}
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '16px',
                            fontWeight: 500,
                            color: '#FFFFFF',
                            marginBottom: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {product.name}
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: 'rgba(255, 255, 255, 0.5)',
                          }}
                        >
                          {product.era} · {product.category}
                        </div>
                      </div>

                      {/* Price */}
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: 'rgba(255, 255, 255, 0.7)',
                          flexShrink: 0,
                        }}
                      >
                        ${product.price.toLocaleString()}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Keyboard Hints */}
        {query.trim().length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '20px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '14px',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <kbd style={{ 
                padding: '4px 8px', 
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '4px',
                fontSize: '12px',
              }}>↑</kbd>
              <kbd style={{ 
                padding: '4px 8px', 
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '4px',
                fontSize: '12px',
              }}>↓</kbd>
              <span style={{ marginLeft: '4px' }}>to navigate</span>
              <span style={{ margin: '0 8px', opacity: 0.3 }}>·</span>
              <kbd style={{ 
                padding: '4px 8px', 
                backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                borderRadius: '4px',
                fontSize: '12px',
              }}>ESC</kbd>
              <span style={{ marginLeft: '4px' }}>to close</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(searchContent, document.body);
}
