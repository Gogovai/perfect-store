import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface ProductRatingProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function ProductRating({
  rating,
  reviewCount = 0,
  size = 'sm',
  showCount = true,
}: ProductRatingProps) {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  if (reviewCount === 0 && rating === 0) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`${sizeClasses[size]} text-gray-200`} />
          ))}
        </div>
        {showCount && (
          <span className={`${textClasses[size]} text-gray-400`}>No reviews</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className={`${sizeClasses[size]} text-amber-400 fill-amber-400`} />
        ))}
        {hasHalf && (
          <StarHalf className={`${sizeClasses[size]} text-amber-400 fill-amber-400`} />
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className={`${sizeClasses[size]} text-gray-200`} />
        ))}
      </div>
      {showCount && reviewCount > 0 && (
        <span className={`${textClasses[size]} text-gray-500`}>({reviewCount})</span>
      )}
    </div>
  );
}
