import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@/data/products';
import { useAuth } from '@/context/AuthContext';
import { RatingStars } from '@/components/RatingStars';
import { getDisplayRating, getDisplayRatingCount, getStoredRatings } from '@/utils/ratings';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact';
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { isLoggedIn, isSaved, toggleSavedItem, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const [userRating, setUserRating] = useState<number | null>(null);

  useEffect(() => {
    const ratings = getStoredRatings();
    setUserRating(ratings[product.id] ?? null);
  }, [product.id]);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    toggleSavedItem(product.id);
  };

  const saved = isSaved(product.id);
  const displayRating = getDisplayRating(product, userRating);
  const displayRatingCount = getDisplayRatingCount(product, userRating);
  const ratingLabel = displayRatingCount === 1 ? 'rating' : 'ratings';

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block card-lift"
    >
      <div className={`relative overflow-hidden bg-archive-100 rounded-lg ${
        variant === 'compact' ? 'aspect-square' : 'aspect-[4/5]'
      }`}>
        {/* Image */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-700 ease-[var(--ease-expo)] group-hover:scale-105"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-archive-900/0 group-hover:bg-archive-900/10 transition-colors duration-500" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {product.new && (
            <span className="px-3 py-1 bg-cream/90 backdrop-blur-sm text-xs uppercase tracking-wider text-archive-900 rounded-full">
              New
            </span>
          )}
          {product.featured && (
            <span className="px-3 py-1 bg-archive-900/90 backdrop-blur-sm text-xs uppercase tracking-wider text-cream rounded-full">
              Featured
            </span>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
            saved 
              ? 'bg-archive-900 text-cream' 
              : 'bg-cream/90 backdrop-blur-sm text-archive-600 opacity-0 group-hover:opacity-100'
          }`}
          aria-label={saved ? 'Remove from saved' : 'Save item'}
        >
          <svg 
            className="w-5 h-5" 
            fill={saved ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Quick View */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[var(--ease-expo)]">
          <div className="flex justify-center">
            <span className="px-6 py-3 bg-cream/95 backdrop-blur-sm text-archive-900 text-sm uppercase tracking-wider rounded-full">
              View Details
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-archive-500 mb-1">{product.era} · {product.category}</p>
            <h3 className="font-medium text-archive-900 group-hover:text-archive-600 transition-colors duration-300 line-clamp-1">
              {product.name}
            </h3>
          </div>
          <p className="font-editorial text-lg text-archive-900 flex-shrink-0">
            ${product.price.toLocaleString()}
          </p>
        </div>
        {variant === 'default' && (
          <p className="text-sm text-archive-500 mt-2 line-clamp-2">
            {product.tagline}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-archive-500">
          <RatingStars rating={displayRating} />
          <span>{displayRating.toFixed(1)}</span>
          <span className="text-archive-300">•</span>
          <span>{displayRatingCount} {ratingLabel}</span>
        </div>
      </div>
    </Link>
  );
}
