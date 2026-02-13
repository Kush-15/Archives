import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { products, Product } from '@/data/products';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (query.length > 0) {
      const searchTerms = query.toLowerCase().split(' ');
      const filtered = products.filter(product => {
        const searchText = `${product.name} ${product.description} ${product.category} ${product.era}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      });
      setResults(filtered);
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    }
  }, [onClose, results.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-archive-900/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      
      {/* Search Container */}
      <div className="relative max-w-3xl mx-auto mt-[15vh] px-4 animate-slide-up">
        {/* Search Input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search the archives..."
            className="w-full px-6 py-5 bg-cream text-xl font-light border-0 rounded-lg shadow-2xl focus:outline-none placeholder:text-archive-400"
            aria-label="Search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
          />
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-archive-400 hover:text-archive-900 transition-colors"
            aria-label="Close search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results */}
        {query.length > 0 && (
          <div 
            id="search-results"
            className="mt-4 bg-cream rounded-lg shadow-xl max-h-[60vh] overflow-y-auto"
            role="listbox"
          >
            {results.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-archive-500">No artifacts found for "{query}"</p>
                <p className="text-sm text-archive-400 mt-2">Try searching for a category, era, or product name</p>
              </div>
            ) : (
              <ul className="divide-y divide-archive-100">
                {results.map((product, index) => (
                  <li key={product.id}>
                    <Link
                      to={`/product/${product.id}`}
                      onClick={onClose}
                      className={`flex items-center gap-4 p-4 transition-colors ${
                        index === selectedIndex ? 'bg-archive-100' : 'hover:bg-archive-50'
                      }`}
                      role="option"
                      aria-selected={index === selectedIndex}
                    >
                      <div className="w-16 h-16 bg-archive-100 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-archive-900 truncate">{product.name}</h4>
                        <p className="text-sm text-archive-500">{product.era} · {product.category}</p>
                      </div>
                      <span className="text-archive-600">${product.price.toLocaleString()}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Hint */}
        {query.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-archive-400 text-sm">
              Press <kbd className="px-2 py-1 bg-cream/50 rounded text-archive-500">↑</kbd> <kbd className="px-2 py-1 bg-cream/50 rounded text-archive-500">↓</kbd> to navigate · <kbd className="px-2 py-1 bg-cream/50 rounded text-archive-500">ESC</kbd> to close
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
