import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { FlashSale } from '@/components/home/FlashSale';
import { CategoryBar } from '@/components/home/CategoryBar';
import { PromoBanners } from '@/components/home/PromoBanners';
import { FeaturedStores } from '@/components/home/FeaturedStores';
import { getFeaturedProducts, getNewestProducts, getTopRatedProducts, getProducts } from '@/lib/queries/products';
import { getCategories } from '@/lib/queries/categories';
import { HERO_SLIDES, FLASH_SALE_ITEMS, PROMO_BANNERS, FEATURED_STORES, getCategoryImage } from '@/lib/data/campaigns';
import { brand } from '@/config/brand';
import { PackageSearch, ArrowRight, CreditCard, Truck, Headphones, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = { title: `${brand.name} — Online Marketplace`, description: brand.description, openGraph: { title: brand.name, description: brand.description, type: 'website' } };

export default async function Home() {
  const [featuredProducts, newestProducts, topRatedProducts, categories, moreProducts] = await Promise.all([getFeaturedProducts(8), getNewestProducts(8), getTopRatedProducts(8), getCategories(), getProducts({ sort: 'popular', page: 1, pageSize: 12 })]);
  return <>
    <CategoryBar categories={categories.slice(0, 12)} />
    <HeroCarousel slides={HERO_SLIDES} />
    <FlashSale items={FLASH_SALE_ITEMS} />
    <section className="bg-white border-b border-gray-100"><Container size="xl"><div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100"><TrustItem icon={<CreditCard size={20} />} title="Secure Payment" sub="100% protected" /><TrustItem icon={<ShieldCheck size={20} />} title="Quality Products" sub="Verified sellers" /><TrustItem icon={<Truck size={20} />} title="Fast Delivery" sub="Across Ghana" /><TrustItem icon={<Headphones size={20} />} title="24/7 Support" sub="Dedicated help" /></div></Container></section>
    <section className="py-8 sm:py-10 bg-white"><Container size="xl"><div className="flex items-center justify-between mb-5"><h2 className="text-lg sm:text-xl font-bold text-gray-900">Shop by Category</h2><Link href="/categories" className="text-sm text-[#0f2b5b] hover:text-[#1a3d7c] font-medium hidden sm:inline">View all</Link></div><div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">{categories.slice(0, 10).map((cat) => { const imageUrl = cat.image_url || getCategoryImage(cat.slug, null); return <Link key={cat.id} href={`/categories/${cat.slug}`} className="group text-center"><div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2 border border-gray-100 group-hover:border-gray-200 transition-colors"><Image src={imageUrl} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw" /></div><p className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-[#0f2b5b] transition-colors line-clamp-1">{cat.name}</p></Link>; })}</div></Container></section>
    <PromoBanners banners={PROMO_BANNERS} />
    <ProductSection title="Popular Products" subtitle="Best-selling items on our marketplace" href="/products?sort=popular" products={featuredProducts} emptyTitle="Products coming soon" emptyDescription="We're curating the best products for you." />
    {categories.slice(0, 3).map(async (cat) => { const result = await getProducts({ categorySlug: cat.slug, pageSize: 4 }); return result.products.length ? <section key={cat.id} className="py-8 sm:py-10 border-t border-gray-100 bg-gray-50/50"><Container size="xl"><SectionHeader title={cat.name} subtitle={`Browse ${cat.name.toLowerCase()} products`} href={`/categories/${cat.slug}`} /><ProductGrid products={result.products} /></Container></section> : null; })}
    <section className="bg-gray-50 border-y border-gray-100"><FeaturedStores stores={FEATURED_STORES} /></section>
    <ProductSection title="New Arrivals" subtitle="Recently added products" href="/products?sort=newest" products={newestProducts} emptyTitle="No products yet" emptyDescription="New products will appear here as sellers list them." />
    {topRatedProducts.length > 0 && <section className="py-8 sm:py-10 border-t border-gray-100 bg-gray-50/50"><Container size="xl"><SectionHeader title="Top Rated" subtitle="Products with the best reviews" href="/products?sort=rating" /><ProductGrid products={topRatedProducts} /></Container></section>}
    {moreProducts.products.length > 0 && <ProductSection title="More to Love" subtitle="Discover something great" href="/products" products={moreProducts.products} />}
    <section className="relative overflow-hidden" style={{ backgroundColor: brand.colors.primary }}><Container size="lg"><div className="relative py-12 sm:py-16 text-center"><h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Grow Your Business With Us</h2><p className="text-white/70 mb-8 max-w-xl mx-auto text-sm sm:text-base">Join thousands of sellers reaching customers across Ghana. Start selling on {brand.name} today.</p><div className="flex flex-col sm:flex-row gap-3 justify-center"><Link href="/seller/apply"><Button size="lg" className="bg-white font-semibold" style={{ color: brand.colors.primary }}>Start Selling <ArrowRight size={18} /></Button></Link><Link href="/seller/apply"><Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">Learn More</Button></Link></div></div></Container></section>
  </>;
}

function ProductSection({ title, subtitle, href, products, emptyTitle, emptyDescription }: { title: string; subtitle: string; href: string; products: import('@/lib/queries/products').ProductWithRelations[]; emptyTitle?: string; emptyDescription?: string }) { return <section className="py-8 sm:py-10 bg-white"><Container size="xl"><SectionHeader title={title} subtitle={subtitle} href={href} />{products.length ? <ProductGrid products={products} /> : emptyTitle ? <EmptyState title={emptyTitle} description={emptyDescription || ''} /> : null}</Container></section>; }
function TrustItem({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) { return <div className="flex items-center gap-3 py-3 px-4 sm:px-6 justify-center"><div className="text-[#0f2b5b] shrink-0">{icon}</div><div><p className="text-xs sm:text-sm font-semibold text-gray-900">{title}</p><p className="text-[10px] sm:text-xs text-gray-500">{sub}</p></div></div>; }
function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href: string }) { return <div className="flex items-center justify-between mb-5"><div><h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>{subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}</div><Link href={href} className="text-sm font-medium hidden sm:inline-flex items-center gap-0.5 hover:gap-1 transition-all" style={{ color: brand.colors.primary }}>View all <ArrowRight size={14} /></Link></div>; }
function EmptyState({ title, description }: { title: string; description: string }) { return <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-xl border border-gray-200"><div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400"><PackageSearch size={32} /></div><h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3><p className="text-sm text-gray-500 max-w-sm">{description}</p></div>; }
