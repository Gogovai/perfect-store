/**
 * Demo data for development and testing
 * This data is clearly marked as DEMO DATA and will be replaced with real data from Supabase
 */

export interface HeroCampaign {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  backgroundColor?: string;
  order: number;
}

export const DEMO_HERO_CAMPAIGNS: HeroCampaign[] = [
  {
    id: 'hero-1',
    title: 'Electronics Week',
    subtitle: 'Save up to 50% on smartphones, laptops, and accessories',
    ctaText: 'Shop Electronics',
    ctaLink: '/categories/electronics',
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=500&fit=crop&q=80',
    backgroundColor: '#1e3a8a',
    order: 1,
  },
  {
    id: 'hero-2',
    title: 'Fashion Forward',
    subtitle: 'Discover the latest trends in clothing and accessories',
    ctaText: 'Browse Fashion',
    ctaLink: '/categories/fashion',
    imageUrl:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=500&fit=crop&q=80',
    backgroundColor: '#7c3aed',
    order: 2,
  },
  {
    id: 'hero-3',
    title: 'Home Essentials',
    subtitle: 'Transform your home with our curated collection',
    ctaText: 'Shop Home',
    ctaLink: '/categories/home-living',
    imageUrl:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=500&fit=crop&q=80',
    backgroundColor: '#ea580c',
    order: 3,
  },
  {
    id: 'hero-4',
    title: 'Beauty & Personal Care',
    subtitle: 'Premium beauty products delivered to your door',
    ctaText: 'Explore Beauty',
    ctaLink: '/categories/beauty',
    imageUrl:
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=1200&h=500&fit=crop&q=80',
    backgroundColor: '#ec4899',
    order: 4,
  },
  {
    id: 'hero-5',
    title: 'Sports & Outdoors',
    subtitle: 'Get active with our sports equipment and gear',
    ctaText: 'Shop Sports',
    ctaLink: '/categories/sports',
    imageUrl:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=500&fit=crop&q=80',
    backgroundColor: '#059669',
    order: 5,
  },
  {
    id: 'hero-6',
    title: 'Exclusive Seller Deals',
    subtitle: 'Limited time offers from verified sellers',
    ctaText: 'View Deals',
    ctaLink: '/deals',
    imageUrl:
      'https://images.unsplash.com/photo-1549887534-7e4b8f0e6b4e?w=1200&h=500&fit=crop&q=80',
    backgroundColor: '#d97706',
    order: 6,
  },
];

export interface PromoCampaign {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  backgroundColor?: string;
  height?: 'sm' | 'md' | 'lg';
}

export const DEMO_PROMO_CAMPAIGNS: PromoCampaign[] = [
  {
    id: 'promo-1',
    title: 'Electronics Week Sale',
    subtitle: 'Up to 50% Off',
    imageUrl:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=300&fit=crop&q=80',
    ctaText: 'Shop Now',
    ctaLink: '/categories/electronics',
    backgroundColor: '#1e3a8a',
    height: 'md',
  },
  {
    id: 'promo-2',
    title: 'Fashion Deals',
    subtitle: '30% Discount',
    imageUrl:
      'https://images.unsplash.com/photo-1539533057144-f4b8b8e48c3b?w=600&h=300&fit=crop&q=80',
    ctaText: 'Discover',
    ctaLink: '/categories/fashion',
    backgroundColor: '#7c3aed',
    height: 'md',
  },
];

export interface DemoCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  productCount?: number;
  description?: string;
}

export const DEMO_CATEGORIES: DemoCategory[] = [
  {
    id: 'cat-1',
    name: 'Phones & Tablets',
    slug: 'phones-tablets',
    imageUrl:
      'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=300&h=300&fit=crop&q=80',
    productCount: 1200,
    description: 'Smartphones, tablets, and mobile devices',
  },
  {
    id: 'cat-2',
    name: 'Computers',
    slug: 'computers',
    imageUrl:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop&q=80',
    productCount: 850,
    description: 'Laptops, desktops, and accessories',
  },
  {
    id: 'cat-3',
    name: 'Electronics',
    slug: 'electronics',
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop&q=80',
    productCount: 2100,
    description: 'Home electronics and appliances',
  },
  {
    id: 'cat-4',
    name: 'Fashion',
    slug: 'fashion',
    imageUrl:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop&q=80',
    productCount: 5400,
    description: 'Clothing, shoes, and accessories',
  },
  {
    id: 'cat-5',
    name: 'Home & Living',
    slug: 'home-living',
    imageUrl:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop&q=80',
    productCount: 3200,
    description: 'Furniture, decor, and home essentials',
  },
  {
    id: 'cat-6',
    name: 'Beauty',
    slug: 'beauty',
    imageUrl:
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&h=300&fit=crop&q=80',
    productCount: 2800,
    description: 'Skincare, makeup, and personal care',
  },
  {
    id: 'cat-7',
    name: 'Sports',
    slug: 'sports',
    imageUrl:
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&h=300&fit=crop&q=80',
    productCount: 1600,
    description: 'Sports equipment and outdoor gear',
  },
  {
    id: 'cat-8',
    name: 'Automotive',
    slug: 'automotive',
    imageUrl:
      'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=300&h=300&fit=crop&q=80',
    productCount: 950,
    description: 'Car accessories and maintenance',
  },
  {
    id: 'cat-9',
    name: 'Baby & Kids',
    slug: 'baby-kids',
    imageUrl:
      'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=300&h=300&fit=crop&q=80',
    productCount: 2200,
    description: 'Baby products and children&apos;s items',
  },
  {
    id: 'cat-10',
    name: 'Health & Wellness',
    slug: 'health-wellness',
    imageUrl:
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&h=300&fit=crop&q=80',
    productCount: 1400,
    description: 'Health supplements and wellness products',
  },
];

export interface DemoStore {
  id: string;
  name: string;
  logoUrl: string;
  bannerUrl: string;
  description: string;
  rating: number;
  productCount: number;
  isVerified: boolean;
}

export const DEMO_STORES: DemoStore[] = [
  {
    id: 'store-1',
    name: 'TechHub Ghana',
    logoUrl:
      'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=200&h=200&fit=crop&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=300&fit=crop&q=80',
    description: 'Your trusted source for all electronics and gadgets',
    rating: 4.8,
    productCount: 500,
    isVerified: true,
  },
  {
    id: 'store-2',
    name: 'Fashion First',
    logoUrl:
      'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=200&h=200&fit=crop&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=300&fit=crop&q=80',
    description: 'Latest fashion trends for everyone',
    rating: 4.7,
    productCount: 800,
    isVerified: true,
  },
  {
    id: 'store-3',
    name: 'HomeComfort',
    logoUrl:
      'https://images.unsplash.com/photo-1560080876-daf06472b699?w=200&h=200&fit=crop&q=80',
    bannerUrl:
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=300&fit=crop&q=80',
    description: 'Making homes beautiful and comfortable',
    rating: 4.6,
    productCount: 450,
    isVerified: true,
  },
];

export interface DemoProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  imageUrlHover?: string;
  seller: string;
  isFlashSale?: boolean;
  discount?: number;
  categoryId: string;
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: 'prod-1',
    name: 'iPhone 15 Pro Max',
    price: 8999,
    originalPrice: 10999,
    rating: 4.9,
    reviewCount: 245,
    imageUrl:
      'https://images.unsplash.com/photo-1592286927505-1def25e17f75?w=400&h=400&fit=crop&q=80',
    imageUrlHover:
      'https://images.unsplash.com/photo-1592286927505-1def25e17f75?w=400&h=400&fit=crop&q=80&flip=h',
    seller: 'TechHub Ghana',
    isFlashSale: true,
    discount: 18,
    categoryId: 'cat-1',
  },
  {
    id: 'prod-2',
    name: 'Samsung Galaxy S24',
    price: 7499,
    originalPrice: 8999,
    rating: 4.8,
    reviewCount: 189,
    imageUrl:
      'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop&q=80',
    seller: 'TechHub Ghana',
    isFlashSale: false,
    discount: 17,
    categoryId: 'cat-1',
  },
  {
    id: 'prod-3',
    name: 'MacBook Pro 14"',
    price: 12999,
    originalPrice: 15999,
    rating: 4.9,
    reviewCount: 312,
    imageUrl:
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop&q=80',
    seller: 'TechHub Ghana',
    isFlashSale: false,
    discount: 19,
    categoryId: 'cat-2',
  },
  {
    id: 'prod-4',
    name: 'Casual Denim Jacket',
    price: 1499,
    originalPrice: 1999,
    rating: 4.6,
    reviewCount: 87,
    imageUrl:
      'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=400&h=400&fit=crop&q=80',
    seller: 'Fashion First',
    isFlashSale: true,
    discount: 25,
    categoryId: 'cat-4',
  },
  {
    id: 'prod-5',
    name: 'Luxury Leather Handbag',
    price: 3999,
    originalPrice: 5999,
    rating: 4.8,
    reviewCount: 156,
    imageUrl:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop&q=80',
    seller: 'Fashion First',
    isFlashSale: false,
    discount: 33,
    categoryId: 'cat-4',
  },
  {
    id: 'prod-6',
    name: 'Modern Coffee Table',
    price: 2299,
    originalPrice: 3299,
    rating: 4.7,
    reviewCount: 92,
    imageUrl:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop&q=80',
    seller: 'HomeComfort',
    isFlashSale: false,
    discount: 30,
    categoryId: 'cat-5',
  },
  {
    id: 'prod-7',
    name: 'Skincare Essentials Set',
    price: 899,
    originalPrice: 1299,
    rating: 4.9,
    reviewCount: 234,
    imageUrl:
      'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop&q=80',
    seller: 'Beauty First',
    isFlashSale: true,
    discount: 31,
    categoryId: 'cat-6',
  },
  {
    id: 'prod-8',
    name: 'Professional Camera',
    price: 18999,
    originalPrice: 24999,
    rating: 4.9,
    reviewCount: 178,
    imageUrl:
      'https://images.unsplash.com/photo-1606986628025-35d57e735ae0?w=400&h=400&fit=crop&q=80',
    seller: 'TechHub Ghana',
    isFlashSale: false,
    discount: 24,
    categoryId: 'cat-2',
  },
];

/**
 * Get hero campaigns
 * In production, this would fetch from Supabase
 */
export function getHeroCampaigns(): HeroCampaign[] {
  return DEMO_HERO_CAMPAIGNS;
}

/**
 * Get promo campaigns
 * In production, this would fetch from Supabase
 */
export function getPromoCampaigns(): PromoCampaign[] {
  return DEMO_PROMO_CAMPAIGNS;
}

/**
 * Get categories
 * In production, this would fetch from Supabase
 */
export function getCategories(): DemoCategory[] {
  return DEMO_CATEGORIES;
}

/**
 * Get featured stores
 * In production, this would fetch from Supabase
 */
export function getFeaturedStores(): DemoStore[] {
  return DEMO_STORES;
}

/**
 * Get products
 * In production, this would fetch from Supabase
 */
export function getProducts(): DemoProduct[] {
  return DEMO_PRODUCTS;
}

/**
 * Get flash sale products
 */
export function getFlashSaleProducts(): DemoProduct[] {
  return DEMO_PRODUCTS.filter((p) => p.isFlashSale).slice(0, 12);
}

/**
 * Get featured products
 */
export function getFeaturedProducts(): DemoProduct[] {
  return DEMO_PRODUCTS.slice(0, 12);
}
