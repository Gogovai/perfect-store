import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Flame, Star, Clock } from 'lucide-react';

interface ProductBadgeProps {
  compareAtPrice?: number | null;
  price: number;
  isNew?: boolean;
  isFeatured?: boolean;
  soldCount?: number;
}

export function ProductBadge({
  compareAtPrice,
  price,
  isNew = false,
  isFeatured = false,
  soldCount = 0,
}: ProductBadgeProps) {
  const hasDiscount = compareAtPrice !== null && compareAtPrice !== undefined && compareAtPrice > price;
  const isPopular = soldCount >= 50;

  const badges: React.ReactNode[] = [];

  if (hasDiscount) {
    const discountPercent = Math.round(((compareAtPrice! - price) / compareAtPrice!) * 100);
    badges.push(
      <Badge key="deal" variant="danger" className="text-xs">
        <Flame size={12} />
        {discountPercent}% OFF
      </Badge>
    );
  }

  if (isNew && !hasDiscount) {
    badges.push(
      <Badge key="new" variant="success" className="text-xs">
        <Clock size={12} />
        New
      </Badge>
    );
  }

  if (isFeatured) {
    badges.push(
      <Badge key="featured" variant="primary" className="text-xs">
        <Star size={12} />
        Featured
      </Badge>
    );
  }

  if (isPopular && !hasDiscount) {
    badges.push(
      <Badge key="popular" variant="secondary" className="text-xs">
        Popular
      </Badge>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {badges}
    </div>
  );
}
