'use client';

import Link from 'next/link';
import Image from 'next/image';

// One hero image per category — used in "Shop by Category" grids
const CATEGORY_PHOTOS: Record<string, { image: string; label: string }> = {
  electronics:              { image: '/product-images/electronics/phones.jpg',      label: 'Electronics' },
  'phones-tablets':         { image: '/product-images/phones-tablets/phone.jpg',    label: 'Phones & Tablets' },
  'computers-accessories':  { image: '/product-images/computers-accessories/laptop.jpg', label: 'Computers' },
  fashion:                  { image: '/product-images/fashion/clothing.jpg',        label: 'Fashion' },
  'home-kitchen':           { image: '/product-images/home-kitchen/kitchen.jpg',    label: 'Home & Kitchen' },
  'beauty-personal-care':   { image: '/product-images/beauty-personal-care/skincare.jpg', label: 'Beauty' },
  health:                   { image: '/product-images/health/wellness.jpg',         label: 'Health' },
  'sports-fitness':         { image: '/product-images/sports-fitness/fitness.jpg',  label: 'Sports' },
  automotive:               { image: '/product-images/automotive/car.jpg',          label: 'Automotive' },
  'baby-products':          { image: '/product-images/baby-products/baby.jpg',      label: 'Baby' },
  groceries:                { image: '/product-images/groceries/fresh.jpg',         label: 'Groceries' },
  'office-school':          { image: '/product-images/office-school/office.jpg',    label: 'Office' },
  appliances:               { image: '/product-images/appliances/washing-machine.jpg', label: 'Appliances' },
};

const fallback = CATEGORY_PHOTOS.electronics;

export function CategoryVisual({
  slug,
  href,
  className = '',
}: {
  slug: string;
  href?: string;
  className?: string;
}) {
  const content = CATEGORY_PHOTOS[slug] || fallback;

  const visual = (
    <div
      className={`group relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 ${className}`}
    >
      {/* Single image */}
      <Image
        src={content.image}
        alt={content.label}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      {/* Label */}
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <span className="text-xs font-bold uppercase tracking-wide text-white drop-shadow sm:text-sm">
          {content.label}
        </span>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {visual}
    </Link>
  ) : (
    visual
  );
}

export const CATEGORY_VISUAL_SLUGS = Object.keys(CATEGORY_PHOTOS);
