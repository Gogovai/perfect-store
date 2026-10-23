'use client';

import Link from 'next/link';
import Image from 'next/image';

const CATEGORY_PHOTOS: Record<string, { image: string; label: string }> = {
  fashion: { image: '/product-images/fashion/clothing.jpg', label: 'Fashion' },
  clothing: { image: '/product-images/fashion/clothing.jpg', label: 'Clothing' },
  apparel: { image: '/product-images/fashion/clothing.jpg', label: 'Apparel' },
  menswear: { image: '/product-images/fashion/clothing.jpg', label: 'Men’s Clothing' },
  'mens-clothing': { image: '/product-images/fashion/clothing.jpg', label: 'Men’s Clothing' },
  'mens-fashion': { image: '/product-images/fashion/clothing.jpg', label: 'Men’s Fashion' },
  womenswear: { image: '/product-images/fashion/clothing.jpg', label: 'Women’s Clothing' },
  'womens-clothing': { image: '/product-images/fashion/clothing.jpg', label: 'Women’s Clothing' },
  'womens-fashion': { image: '/product-images/fashion/clothing.jpg', label: 'Women’s Fashion' },
  shoes: { image: '/product-images/fashion/shoes.jpg', label: 'Shoes' },
  footwear: { image: '/product-images/fashion/shoes.jpg', label: 'Footwear' },
  accessories: { image: '/product-images/fashion/bags.jpg', label: 'Accessories' },
  bags: { image: '/product-images/fashion/bags.jpg', label: 'Bags' },
  'traditional-wear': { image: '/product-images/fashion/clothing.jpg', label: 'Traditional Wear' },
  ankara: { image: '/product-images/fashion/clothing.jpg', label: 'Ankara' },
};

const fallback = CATEGORY_PHOTOS.fashion;

function labelFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function CategoryVisual({
  slug,
  href,
  className = '',
}: {
  slug: string;
  href?: string;
  className?: string;
}) {
  const content = CATEGORY_PHOTOS[slug] ?? { ...fallback, label: labelFromSlug(slug) || fallback.label };

  const visual = (
    <div className={`group relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 ${className}`}>
      <Image
        src={content.image}
        alt={content.label}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <span className="text-xs font-bold uppercase tracking-wide text-white drop-shadow sm:text-sm">
          {content.label}
        </span>
      </div>
    </div>
  );

  return href ? <Link href={href} className="block">{visual}</Link> : visual;
}

export const CATEGORY_VISUAL_SLUGS = Object.keys(CATEGORY_PHOTOS);
