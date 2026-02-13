import { Product } from '@/data/products';

const RATINGS_STORAGE_KEY = 'productRatings';

export function getStoredRatings(): Record<string, number> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(RATINGS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStoredRating(productId: string, rating: number) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const current = getStoredRatings();
    const safeRating = Math.max(1, Math.min(5, Math.round(rating)));
    const updated = { ...current, [productId]: safeRating };
    window.localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    return;
  }
}

export function getDisplayRating(product: Product, userRating?: number | null) {
  if (!userRating) {
    return product.rating;
  }
  return (product.rating * product.ratingCount + userRating) / (product.ratingCount + 1);
}

export function getDisplayRatingCount(product: Product, userRating?: number | null) {
  return product.ratingCount + (userRating ? 1 : 0);
}
