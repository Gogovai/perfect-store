/**
 * Campaign and merchandising data structures.
 * These can later be connected to a Supabase campaigns table.
 * Currently using development/demo data with legitimate placeholder images.
 */

export type HeroSlide = {
  id: string;
  headline: string;
  subtext: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
};

export type FlashSaleItem = {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  imageUrl: string;
  discountPercent: number;
  slug: string;
};

export type PromoBanner = {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  bgColor: string;
};

export type FeaturedStore = {
  id: string;
  name: string;
  logoUrl: string;
  bannerUrl: string;
  productCount: number;
  rating: number;
  slug: string;
};

/**
 * Hero carousel slides — development data.
 * Replace with Supabase campaigns data in production.
 */
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    headline: 'Big Tech Deals',
    subtext: 'Upgrade your setup for less — smartphones, laptops & gadgets',
    ctaText: 'Shop Electronics',
    ctaLink: '/categories/electronics',
    imageUrl: 'https://picsum.photos/seed/electronics-hero/1200/500',
    bgColor: '#0f2b5b',
    textColor: '#ffffff',
  },
  {
    id: 'slide-2',
    headline: 'Fashion Week',
    subtext: 'Discover your next look from top Ghanaian sellers',
    ctaText: 'Shop Fashion',
    ctaLink: '/categories/fashion',
    imageUrl: 'https://picsum.photos/seed/fashion-hero/1200/500',
    bgColor: '#7c3aed',
    textColor: '#ffffff',
  },
  {
    id: 'slide-3',
    headline: 'Home & Living',
    subtext: 'Make your space better with quality furniture & decor',
    ctaText: 'Shop Home',
    ctaLink: '/categories/home-living',
    imageUrl: 'https://picsum.photos/seed/home-hero/1200/500',
    bgColor: '#0891b2',
    textColor: '#ffffff',
  },
  {
    id: 'slide-4',
    headline: 'Beauty & Personal Care',
    subtext: 'Everything you need to look and feel your best',
    ctaText: 'Explore Beauty',
    ctaLink: '/categories/beauty',
    imageUrl: 'https://picsum.photos/seed/beauty-hero/1200/500',
    bgColor: '#be185d',
    textColor: '#ffffff',
  },
  {
    id: 'slide-5',
    headline: 'Become a Seller',
    subtext: 'Reach thousands of customers across Ghana',
    ctaText: 'Start Selling',
    ctaLink: '/seller/apply',
    imageUrl: 'https://picsum.photos/seed/seller-hero/1200/500',
    bgColor: '#e85d26',
    textColor: '#ffffff',
  },
];

/**
 * Flash sale items — development/demo data.
 */
export const FLASH_SALE_ITEMS: FlashSaleItem[] = [
  {
    id: 'flash-1',
    name: 'Wireless Bluetooth Earbuds',
    originalPrice: 299.99,
    salePrice: 149.99,
    imageUrl: 'https://picsum.photos/seed/earbuds-deal/300/300',
    discountPercent: 50,
    slug: 'wireless-bluetooth-earbuds',
  },
  {
    id: 'flash-2',
    name: 'Smartphone Case Premium',
    originalPrice: 89.99,
    salePrice: 44.99,
    imageUrl: 'https://picsum.photos/seed/phone-case/300/300',
    discountPercent: 50,
    slug: 'smartphone-case-premium',
  },
  {
    id: 'flash-3',
    name: 'Portable Charger 10000mAh',
    originalPrice: 199.99,
    salePrice: 119.99,
    imageUrl: 'https://picsum.photos/seed/power-bank/300/300',
    discountPercent: 40,
    slug: 'portable-charger-10000mah',
  },
  {
    id: 'flash-4',
    name: 'Running Shoes Lightweight',
    originalPrice: 450.00,
    salePrice: 269.99,
    imageUrl: 'https://picsum.photos/seed/running-shoes/300/300',
    discountPercent: 40,
    slug: 'running-shoes-lightweight',
  },
  {
    id: 'flash-5',
    name: 'Stainless Steel Water Bottle',
    originalPrice: 79.99,
    salePrice: 39.99,
    imageUrl: 'https://picsum.photos/seed/water-bottle/300/300',
    discountPercent: 50,
    slug: 'stainless-steel-water-bottle',
  },
  {
    id: 'flash-6',
    name: 'LED Desk Lamp Adjustable',
    originalPrice: 220.00,
    salePrice: 129.99,
    imageUrl: 'https://picsum.photos/seed/desk-lamp/300/300',
    discountPercent: 41,
    slug: 'led-desk-lamp-adjustable',
  },
  {
    id: 'flash-7',
    name: 'Wireless Mouse Ergonomic',
    originalPrice: 150.00,
    salePrice: 79.99,
    imageUrl: 'https://picsum.photos/seed/wireless-mouse/300/300',
    discountPercent: 47,
    slug: 'wireless-mouse-ergonomic',
  },
  {
    id: 'flash-8',
    name: 'Cotton T-Shirt Classic Fit',
    originalPrice: 120.00,
    salePrice: 59.99,
    imageUrl: 'https://picsum.photos/seed/cotton-tshirt/300/300',
    discountPercent: 50,
    slug: 'cotton-tshirt-classic-fit',
  },
];

/**
 * Promotional banners — development data.
 */
export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'promo-1',
    title: 'Electronics Deals',
    description: 'Save big on the latest gadgets and tech',
    ctaText: 'Shop Now',
    ctaLink: '/categories/electronics',
    imageUrl: 'https://picsum.photos/seed/electronics-promo/600/300',
    bgColor: '#0f2b5b',
  },
  {
    id: 'promo-2',
    title: 'Fashion Sale',
    description: 'New season, new styles at reduced prices',
    ctaText: 'Explore',
    ctaLink: '/categories/fashion',
    imageUrl: 'https://picsum.photos/seed/fashion-promo/600/300',
    bgColor: '#7c3aed',
  },
  {
    id: 'promo-3',
    title: 'Home Upgrade',
    description: 'Make your home beautiful for less',
    ctaText: 'Shop Home',
    ctaLink: '/categories/home-living',
    imageUrl: 'https://picsum.photos/seed/home-promo/600/300',
    bgColor: '#0891b2',
  },
];

/**
 * Featured stores — development/demo data.
 */
export const FEATURED_STORES: FeaturedStore[] = [
  {
    id: 'store-1',
    name: 'TechHub Ghana',
    logoUrl: 'https://picsum.photos/seed/techhub/80/80',
    bannerUrl: 'https://picsum.photos/seed/techhub-banner/400/200',
    productCount: 156,
    rating: 4.8,
    slug: 'techhub-ghana',
  },
  {
    id: 'store-2',
    name: 'Fashion Avenue',
    logoUrl: 'https://picsum.photos/seed/fashion-ave/80/80',
    bannerUrl: 'https://picsum.photos/seed/fashion-banner/400/200',
    productCount: 89,
    rating: 4.6,
    slug: 'fashion-avenue',
  },
  {
    id: 'store-3',
    name: 'Home Essentials',
    logoUrl: 'https://picsum.photos/seed/home-ess/80/80',
    bannerUrl: 'https://picsum.photos/seed/home-banner/400/200',
    productCount: 234,
    rating: 4.7,
    slug: 'home-essentials',
  },
  {
    id: 'store-4',
    name: 'Gadget World',
    logoUrl: 'https://picsum.photos/seed/gadget-world/80/80',
    bannerUrl: 'https://picsum.photos/seed/gadget-banner/400/200',
    productCount: 67,
    rating: 4.5,
    slug: 'gadget-world',
  },
  {
    id: 'store-5',
    name: 'Beauty Palace',
    logoUrl: 'https://picsum.photos/seed/beauty-palace/80/80',
    bannerUrl: 'https://picsum.photos/seed/beauty-banner/400/200',
    productCount: 112,
    rating: 4.9,
    slug: 'beauty-palace',
  },
];

/**
 * Category image mapping for development.
 */
export const CATEGORY_IMAGES: Record<string, string> = {
  'phones-tablets': 'https://picsum.photos/seed/cat-phones/400/400',
  'computers': 'https://picsum.photos/seed/cat-computers/400/400',
  'electronics': 'https://picsum.photos/seed/cat-electronics/400/400',
  'fashion': 'https://picsum.photos/seed/cat-fashion/400/400',
  'home-living': 'https://picsum.photos/seed/cat-home/400/400',
  'beauty': 'https://picsum.photos/seed/cat-beauty/400/400',
  'sports': 'https://picsum.photos/seed/cat-sports/400/400',
  'automotive': 'https://picsum.photos/seed/cat-auto/400/400',
  'baby-kids': 'https://picsum.photos/seed/cat-baby/400/400',
  'health': 'https://picsum.photos/seed/cat-health/400/400',
};

/**
 * Get category image URL.
 */
export function getCategoryImage(slug: string, icon: string | null): string {
  if (icon && (icon.startsWith('http://') || icon.startsWith('https://'))) {
    return icon;
  }
  return CATEGORY_IMAGES[slug] || 'https://picsum.photos/seed/category-default/400/400';
}

/**
 * Get category background color for visual variety.
 */
export function getCategoryColor(slug: string): string {
  const colors: Record<string, string> = {
    'phones-tablets': '#0f2b5b',
    'computers': '#1e3a5f',
    'electronics': '#7c3aed',
    'fashion': '#e85d26',
    'home-living': '#0891b2',
    'beauty': '#ec4899',
    'sports': '#059669',
    'automotive': '#475569',
    'baby-kids': '#f59e0b',
    'health': '#10b981',
  };
  return colors[slug] || '#0f2b5b';
}
