interface RatingStarsProps {
  rating: number;
  size?: number;
  className?: string;
}

export function RatingStars({ rating, size = 14, className = '' }: RatingStarsProps) {
  const clampedRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.round(clampedRating);

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      aria-label={`Rating ${clampedRating.toFixed(1)} out of 5`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < fullStars;
        return (
          <svg
            key={index}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={filled ? 'text-archive-900' : 'text-archive-300'}
            fill="currentColor"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        );
      })}
    </div>
  );
}
