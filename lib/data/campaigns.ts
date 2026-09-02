export type HeroSlide={id:string;headline:string;subtext:string;ctaText:string;ctaLink:string;imageUrl:string;bgColor:string;textColor:string};export type FlashSaleItem={id:string;name:string;originalPrice:number;salePrice:number;imageUrl:string;discountPercent:number;slug:string};export type PromoBanner={id:string;title:string;description:string;ctaText:string;ctaLink:string;imageUrl:string;bgColor:string};export type FeaturedStore={id:string;name:string;logoUrl:string;bannerUrl:string;productCount:number;rating:number;slug:string};

const PHOTO={
  electronics:'/product-images/electronics/phones.jpg',
  fashion:'/product-images/fashion/clothing.jpg',
  home:'/product-images/home-kitchen/kitchen.jpg',
  beauty:'/product-images/beauty-personal-care/skincare.jpg',
  sell:'/product-images/electronics/laptop.jpg',
};

export const HERO_SLIDES:HeroSlide[]=[
  {id:'slide-1',headline:'Big Tech Deals',subtext:'Upgrade your setup with trusted electronics from verified sellers.',ctaText:'Shop Electronics',ctaLink:'/categories/electronics',imageUrl:PHOTO.electronics,bgColor:'#0f2b5b',textColor:'#fff'},
  {id:'slide-2',headline:'Ghanaian Fashion',subtext:'Discover clothing, footwear and accessories from marketplace sellers.',ctaText:'Shop Fashion',ctaLink:'/categories/fashion',imageUrl:PHOTO.fashion,bgColor:'#e85d26',textColor:'#fff'},
  {id:'slide-3',headline:'Home & Kitchen',subtext:'Quality essentials for every room in your home.',ctaText:'Shop Home',ctaLink:'/categories/home-kitchen',imageUrl:PHOTO.home,bgColor:'#1d4d78',textColor:'#fff'},
  {id:'slide-4',headline:'Beauty & Personal Care',subtext:'Everyday personal-care essentials from marketplace stores.',ctaText:'Explore Beauty',ctaLink:'/categories/beauty-personal-care',imageUrl:PHOTO.beauty,bgColor:'#9a315f',textColor:'#fff'},
  {id:'slide-5',headline:'Sell on Perfect Store',subtext:'Build your store and reach customers across Ghana.',ctaText:'Start Selling',ctaLink:'/seller/apply',imageUrl:PHOTO.sell,bgColor:'#b45309',textColor:'#fff'},
];

export const FLASH_SALE_ITEMS:FlashSaleItem[]=[];
export const PROMO_BANNERS:PromoBanner[]=[
  {id:'promo-1',title:'Electronics',description:'Shop phones, computers and everyday gadgets.',ctaText:'Shop now',ctaLink:'/categories/electronics',imageUrl:PHOTO.electronics,bgColor:'#0f2b5b'},
  {id:'promo-2',title:'Fashion',description:'Find your next look from local marketplace sellers.',ctaText:'Explore',ctaLink:'/categories/fashion',imageUrl:PHOTO.fashion,bgColor:'#e85d26'},
  {id:'promo-3',title:'Home & Kitchen',description:'Practical products for a better home.',ctaText:'Shop home',ctaLink:'/categories/home-kitchen',imageUrl:PHOTO.home,bgColor:'#1d4d78'},
];
export const FEATURED_STORES:FeaturedStore[]=[];

export const CATEGORY_IMAGES:Record<string,string>={
  electronics:PHOTO.electronics,
  'phones-tablets':'/product-images/phones-tablets/phone.jpg',
  'computers-accessories':'/product-images/computers-accessories/laptop.jpg',
  fashion:PHOTO.fashion,
  'home-kitchen':PHOTO.home,
  'beauty-personal-care':PHOTO.beauty,
  health:'/product-images/health/wellness.jpg',
  'sports-fitness':'/product-images/sports-fitness/running.jpg',
  automotive:'/product-images/automotive/vehicle.jpg',
  'baby-products':'/product-images/baby-products/baby.jpg',
  groceries:'/product-images/groceries/fresh.jpg',
  'office-school':'/product-images/office-school/office.jpg',
  appliances:'/product-images/appliances/washing-machine.jpg',
};

export function getCategoryImage(slug:string,icon:string|null){return icon&&icon.startsWith('http')?icon:(CATEGORY_IMAGES[slug]||'');}
export function getCategoryColor(slug:string){const colors:Record<string,string>={'electronics':'#0f2b5b','phones-tablets':'#1d4d78','computers-accessories':'#334155','fashion':'#e85d26','home-kitchen':'#1d4d78','beauty-personal-care':'#9a315f','health':'#059669','sports-fitness':'#047857','automotive':'#475569','baby-products':'#b45309','groceries':'#365314','office-school':'#1e40af','appliances':'#6b21a8'};return colors[slug]||'#0f2b5b';}
