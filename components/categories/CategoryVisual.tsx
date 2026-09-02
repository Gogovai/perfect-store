'use client';

import Link from 'next/link';

const photos: Record<string, { images: string[]; labels: string[] }> = {
  electronics: { images: ['/product-images/electronics/phones.jpg', '/product-images/electronics/laptop.jpg', '/product-images/electronics/headphones.jpg'], labels: ['Phones', 'Laptops', 'Audio'] },
  'phones-tablets': { images: ['/product-images/phones-tablets/phone.jpg', '/product-images/phones-tablets/tablet.jpg', '/product-images/phones-tablets/watch.jpg'], labels: ['Phones', 'Tablets', 'Watches'] },
  'computers-accessories': { images: ['/product-images/computers-accessories/laptop.jpg', '/product-images/computers-accessories/monitor.jpg', '/product-images/computers-accessories/keyboard.jpg'], labels: ['Laptops', 'Monitors', 'Keyboards'] },
  fashion: { images: ['/product-images/fashion/clothing.jpg', '/product-images/fashion/shoes.jpg', '/product-images/fashion/bags.jpg'], labels: ['Clothing', 'Shoes', 'Bags'] },
  'home-kitchen': { images: ['/product-images/home-kitchen/kitchen.jpg', '/product-images/home-kitchen/cookware.jpg', '/product-images/home-kitchen/home.jpg'], labels: ['Kitchen', 'Cookware', 'Home'] },
  'beauty-personal-care': { images: ['/product-images/beauty-personal-care/skincare.jpg', '/product-images/beauty-personal-care/beauty.jpg', '/product-images/beauty-personal-care/care.jpg'], labels: ['Skincare', 'Beauty', 'Personal Care'] },
  health: { images: ['/product-images/health/wellness.jpg', '/product-images/health/care.jpg', '/product-images/health/medical.jpg'], labels: ['Wellness', 'Health', 'Care'] },
  'sports-fitness': { images: ['/product-images/sports-fitness/running.jpg', '/product-images/sports-fitness/fitness.jpg', '/product-images/sports-fitness/sports.jpg'], labels: ['Running', 'Fitness', 'Sports'] },
  automotive: { images: ['/product-images/automotive/vehicle.jpg', '/product-images/automotive/car.jpg', '/product-images/automotive/accessories.jpg'], labels: ['Vehicles', 'Cars', 'Accessories'] },
  'baby-products': { images: ['/product-images/baby-products/baby.jpg', '/product-images/baby-products/care.jpg', '/product-images/baby-products/toys.jpg'], labels: ['Baby', 'Care', 'Toys'] },
  groceries: { images: ['/product-images/groceries/fresh.jpg', '/product-images/groceries/fresh.jpg', '/product-images/groceries/pantry.jpg'], labels: ['Fresh Food', 'Groceries', 'Pantry'] },
  'office-school': { images: ['/product-images/office-school/office.jpg', '/product-images/office-school/stationery.jpg', '/product-images/office-school/school.jpg'], labels: ['Office', 'Stationery', 'School'] },
  appliances: { images: ['/product-images/appliances/kitchen.jpg', '/product-images/appliances/washing-machine.jpg', '/product-images/appliances/home-appliance.jpg'], labels: ['Kitchen', 'Washing Machines', 'Home Appliances'] },
};

const fallback = photos.electronics;

export function CategoryVisual({ slug, href, className = '' }: { slug: string; href?: string; className?: string }) {
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
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white drop-shadow sm:text-xs">{content.labels[index]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return href ? <Link href={href} className="block">{visual}</Link> : visual;
}

export const CATEGORY_VISUAL_SLUGS = Object.keys(photos);
