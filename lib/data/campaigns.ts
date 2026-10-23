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

export type PromoBanner = {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  bgColor: string;
};

const PHOTO = {
  fashion: '/product-images/fashion/clothing.jpg',
  shoes: '/product-images/fashion/shoes.jpg',
  bags: '/product-images/fashion/bags.jpg',
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'fashion',
    headline: 'Find Your Everyday Style',
    subtext: 'Shop clothing for men and women, with convenient delivery across Ghana.',
    ctaText: 'Shop Clothing',
    ctaLink: '/products',
    imageUrl: PHOTO.fashion,
    bgColor: '#0f2b5b',
    textColor: '#fff',
  },
  {
    id: 'footwear',
    headline: 'Step Out in Style',
    subtext: 'Discover shoes and footwear for work, weekends, and special occasions.',
    ctaText: 'Explore Footwear',
    ctaLink: '/products',
    imageUrl: PHOTO.shoes,
    bgColor: '#6d284f',
    textColor: '#fff',
  },
  {
    id: 'accessories',
    headline: 'Complete Your Look',
    subtext: 'Find the finishing touches for your personal style.',
    ctaText: 'Shop Accessories',
    ctaLink: '/products',
    imageUrl: PHOTO.bags,
    bgColor: '#1d4d78',
    textColor: '#fff',
  },
];

export const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'menswear',
    title: 'Men’s Style',
    description: 'Refresh your wardrobe with everyday essentials.',
    ctaText: 'Shop clothing',
    ctaLink: '/products',
    imageUrl: PHOTO.fashion,
    bgColor: '#0f2b5b',
  },
  {
    id: 'womenswear',
    title: 'Women’s Style',
    description: 'Explore looks for casual days and special moments.',
    ctaText: 'Explore styles',
    ctaLink: '/products',
    imageUrl: PHOTO.bags,
    bgColor: '#9a315f',
  },
  {
    id: 'footwear',
    title: 'Footwear & Accessories',
    description: 'Bring your outfit together with the right finishing touches.',
    ctaText: 'Browse collection',
    ctaLink: '/products',
    imageUrl: PHOTO.shoes,
    bgColor: '#1d4d78',
  },
];
