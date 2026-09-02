'use client';

import Link from 'next/link';

const photos: Record<string, { images: string[]; labels: string[] }> = {
  electronics: {
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Phones', 'Laptops', 'Audio'],
  },
  'phones-tablets': {
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Phones', 'Tablets', 'Watches'],
  },
  'computers-accessories': {
    images: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Laptops', 'Monitors', 'Keyboards'],
  },
  fashion: {
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Clothing', 'Shoes', 'Bags'],
  },
  'home-kitchen': {
    images: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Kitchen', 'Cookware', 'Home'],
  },
  'beauty-personal-care': {
    images: [
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Skincare', 'Beauty', 'Personal Care'],
  },
  health: {
    images: [
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Wellness', 'Health', 'Care'],
  },
  'sports-fitness': {
    images: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Running', 'Fitness', 'Sports'],
  },
  automotive: {
    images: [
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Vehicles', 'Parts', 'Accessories'],
  },
  'baby-products': {
    images: [
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Baby', 'Care', 'Toys'],
  },
  groceries: {
    images: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Fresh Food', 'Groceries', 'Pantry'],
  },
  'office-school': {
    images: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Office', 'Stationery', 'School'],
  },
  appliances: {
    images: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1586208958839-06e9f5a1d8c3?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=85',
    ],
    labels: ['Kitchen', 'Appliances', 'Home'],
  },
};

const fallback = photos.electronics;

export function CategoryVisual({
  slug,
  href,
  className = '',
}: {
  slug: string;
  href?: string;
  className?: string;
}) {
  const content = photos[slug] || fallback;

  const visual = (
    <div className={`group relative overflow-hidden rounded-2xl border border-black/5 bg-gray-100 ${className}`}>
      <div className="grid min-h-44 grid-cols-3 gap-1.5 p-1.5 sm:gap-2 sm:p-2">
        {content.images.map((image, index) => (
          <div key={`${image}-${index}`} className="relative min-h-36 overflow-hidden rounded-xl bg-gray-200 sm:min-h-44">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${image})` }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent px-3 pb-3 pt-10">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white drop-shadow sm:text-xs">
                {content.labels[index]}
              </span>
            </div>
          </div>
        ))}
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

export const CATEGORY_VISUAL_SLUGS = Object.keys(photos);
