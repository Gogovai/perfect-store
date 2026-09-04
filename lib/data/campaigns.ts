export type HeroSlide={id:string;headline:string;subtext:string;ctaText:string;ctaLink:string;imageUrl:string;bgColor:string;textColor:string};export type FlashSaleItem={id:string;name:string;originalPrice:number;salePrice:number;imageUrl:string;discountPercent:number;slug:string};export type PromoBanner={id:string;title:string;description:string;ctaText:string;ctaLink:string;imageUrl:string;bgColor:string};

const PHOTO={
  electronics:'/product-images/electronics/phones.jpg',
  phones:'/product-images/phones-tablets/phone.jpg',
  laptops:'/product-images/computers-accessories/laptop.jpg',
  fashion:'/product-images/fashion/clothing.jpg',
  shoes:'/product-images/fashion/shoes.jpg',
  home:'/product-images/home-kitchen/kitchen.jpg',
  cookware:'/product-images/home-kitchen/cookware.jpg',
  beauty:'/product-images/beauty-personal-care/skincare.jpg',
  makeup:'/product-images/beauty-personal-care/beauty.jpg',
  health:'/product-images/health/wellness.jpg',
  sports:'/product-images/sports-fitness/fitness.jpg',
  running:'/product-images/sports-fitness/running.jpg',
  automotive:'/product-images/automotive/car.jpg',
  baby:'/product-images/baby-products/toys.jpg',
  groceries:'/product-images/groceries/fresh.jpg',
  office:'/product-images/office-school/office.jpg',
  appliances:'/product-images/appliances/washing-machine.jpg',
  headphones:'/product-images/electronics/headphones.jpg',
  sell:'/product-images/electronics/laptop.jpg',
};

export const HERO_SLIDES:HeroSlide[]=[
  {id:'slide-1',headline:'Big Tech Deals',subtext:'Upgrade your setup with trusted electronics from verified sellers.',ctaText:'Shop Electronics',ctaLink:'/categories/electronics',imageUrl:PHOTO.electronics,bgColor:'#0f2b5b',textColor:'#fff'},
  {id:'slide-2',headline:'Ghanaian Fashion',subtext:'Discover clothing, footwear and accessories from marketplace sellers.',ctaText:'Shop Fashion',ctaLink:'/categories/fashion',imageUrl:PHOTO.fashion,bgColor:'#e85d26',textColor:'#fff'},
  {id:'slide-3',headline:'Home & Kitchen',subtext:'Quality essentials for every room in your home.',ctaText:'Shop Home',ctaLink:'/categories/home-kitchen',imageUrl:PHOTO.home,bgColor:'#1d4d78',textColor:'#fff'},
  {id:'slide-4',headline:'Beauty & Personal Care',subtext:'Everyday personal-care essentials from marketplace stores.',ctaText:'Explore Beauty',ctaLink:'/categories/beauty-personal-care',imageUrl:PHOTO.beauty,bgColor:'#9a315f',textColor:'#fff'},
  {id:'slide-5',headline:'Phones & Tablets',subtext:'Latest smartphones and tablets from top brands — Samsung, Apple, Tecno and more.',ctaText:'Shop Phones',ctaLink:'/categories/phones-tablets',imageUrl:PHOTO.phones,bgColor:'#1d4d78',textColor:'#fff'},
  {id:'slide-6',headline:'Laptops & Computers',subtext:'Powerful laptops, monitors and accessories for work, school and play.',ctaText:'Shop Computers',ctaLink:'/categories/computers-accessories',imageUrl:PHOTO.laptops,bgColor:'#334155',textColor:'#fff'},
  {id:'slide-7',headline:'Health & Wellness',subtext:'Vitamins, supplements and health essentials for everyday living.',ctaText:'Shop Health',ctaLink:'/categories/health',imageUrl:PHOTO.health,bgColor:'#059669',textColor:'#fff'},
  {id:'slide-8',headline:'Sports & Fitness',subtext:'Gear up with fitness equipment, activewear and outdoor essentials.',ctaText:'Shop Sports',ctaLink:'/categories/sports-fitness',imageUrl:PHOTO.sports,bgColor:'#047857',textColor:'#fff'},
  {id:'slide-9',headline:'Automotive',subtext:'Car accessories, maintenance supplies and parts from verified sellers.',ctaText:'Shop Auto',ctaLink:'/categories/automotive',imageUrl:PHOTO.automotive,bgColor:'#475569',textColor:'#fff'},
  {id:'slide-10',headline:'Baby & Kids',subtext:'Strollers, toys and everything your little one needs.',ctaText:'Shop Baby',ctaLink:'/categories/baby-products',imageUrl:PHOTO.baby,bgColor:'#b45309',textColor:'#fff'},
  {id:'slide-11',headline:'Fresh Groceries',subtext:'Pantry staples, fresh produce and everyday essentials delivered to you.',ctaText:'Shop Groceries',ctaLink:'/categories/groceries',imageUrl:PHOTO.groceries,bgColor:'#365314',textColor:'#fff'},
  {id:'slide-12',headline:'Office & School',subtext:'Stationery, school supplies and workspace essentials for productivity.',ctaText:'Shop Office',ctaLink:'/categories/office-school',imageUrl:PHOTO.office,bgColor:'#1e40af',textColor:'#fff'},
  {id:'slide-13',headline:'Home Appliances',subtext:'Kitchen and home appliances that make everyday life easier.',ctaText:'Shop Appliances',ctaLink:'/categories/appliances',imageUrl:PHOTO.appliances,bgColor:'#6b21a8',textColor:'#fff'},
  {id:'slide-14',headline:'Sell on Perfect Store',subtext:'Build your store and reach customers across Ghana.',ctaText:'Start Selling',ctaLink:'/seller/apply',imageUrl:PHOTO.sell,bgColor:'#b45309',textColor:'#fff'},
];

export const FLASH_SALE_ITEMS:FlashSaleItem[]=[]; // Managed by lib/data/flash-sale.ts scheduler

export const PROMO_BANNERS:PromoBanner[]=[
  {id:'promo-1',title:'Electronics',description:'Shop phones, computers and everyday gadgets.',ctaText:'Shop now',ctaLink:'/categories/electronics',imageUrl:PHOTO.headphones,bgColor:'#0f2b5b'},
  {id:'promo-2',title:'Fashion',description:'Find your next look from local marketplace sellers.',ctaText:'Explore',ctaLink:'/categories/fashion',imageUrl:PHOTO.shoes,bgColor:'#e85d26'},
  {id:'promo-3',title:'Home & Kitchen',description:'Practical products for a better home.',ctaText:'Shop home',ctaLink:'/categories/home-kitchen',imageUrl:PHOTO.cookware,bgColor:'#1d4d78'},
  {id:'promo-4',title:'Beauty & Skincare',description:'Premium beauty products and skincare essentials.',ctaText:'Shop beauty',ctaLink:'/categories/beauty-personal-care',imageUrl:PHOTO.makeup,bgColor:'#9a315f'},
  {id:'promo-5',title:'Sports & Fitness',description:'Get moving with gear, activewear and outdoor essentials.',ctaText:'Shop sports',ctaLink:'/categories/sports-fitness',imageUrl:PHOTO.running,bgColor:'#047857'},
  {id:'promo-6',title:'Health & Wellness',description:'Vitamins, supplements and health essentials for your family.',ctaText:'Shop health',ctaLink:'/categories/health',imageUrl:PHOTO.health,bgColor:'#059669'},
];

export const CATEGORY_IMAGES:Record<string,string>={
  electronics:PHOTO.electronics,
  'phones-tablets':PHOTO.phones,
  'computers-accessories':PHOTO.laptops,
  fashion:PHOTO.fashion,
  'home-kitchen':PHOTO.home,
  'beauty-personal-care':PHOTO.beauty,
  health:PHOTO.health,
  'sports-fitness':PHOTO.sports,
  automotive:PHOTO.automotive,
  'baby-products':PHOTO.baby,
  groceries:PHOTO.groceries,
  'office-school':PHOTO.office,
  appliances:PHOTO.appliances,
};

export function getCategoryImage(slug:string,icon:string|null){return icon&&icon.startsWith('http')?icon:(CATEGORY_IMAGES[slug]||'');}
export function getCategoryColor(slug:string){const colors:Record<string,string>={'electronics':'#0f2b5b','phones-tablets':'#1d4d78','computers-accessories':'#334155','fashion':'#e85d26','home-kitchen':'#1d4d78','beauty-personal-care':'#9a315f','health':'#059669','sports-fitness':'#047857','automotive':'#475569','baby-products':'#b45309','groceries':'#365314','office-school':'#1e40af','appliances':'#6b21a8'};return colors[slug]||'#0f2b5b';}
