import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { FlashSale } from '@/components/home/FlashSale';
import { CategoryBar } from '@/components/home/CategoryBar';
import { PromoBanners } from '@/components/home/PromoBanners';
import { FeaturedStores } from '@/components/home/FeaturedStores';
import { CategoryVisual } from '@/components/categories/CategoryVisual';
import { getFeaturedProducts, getNewestProducts, getTopRatedProducts, getProducts } from '@/lib/queries/products';
import { getCategories } from '@/lib/queries/categories';
import { HERO_SLIDES, FLASH_SALE_ITEMS, PROMO_BANNERS, FEATURED_STORES } from '@/lib/data/campaigns';
import { brand } from '@/config/brand';
import { ArrowRight, CreditCard, Truck, Headphones, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = { title: `${brand.name} — Online Marketplace`, description: brand.description };

export default async function Home() {
  const [featuredProducts, newestProducts, topRatedProducts, categories, moreProducts] = await Promise.all([
    getFeaturedProducts(8), getNewestProducts(8), getTopRatedProducts(8), getCategories(), getProducts({ sort: 'popular', page: 1, pageSize: 12 }),
  ]);

  return <>
    <CategoryBar categories={categories.slice(0, 12)} />
    <HeroCarousel slides={HERO_SLIDES} />
    <FlashSale items={FLASH_SALE_ITEMS} />

    <section className="border-b border-gray-100 bg-white"><Container size="xl"><div className="grid grid-cols-2 divide-x divide-gray-100 lg:grid-cols-4">
      <TrustItem icon={<CreditCard size={20} />} title="Secure Payment" sub="Protected checkout" />
      <TrustItem icon={<ShieldCheck size={20} />} title="Quality Products" sub="Verified sellers" />
      <TrustItem icon={<Truck size={20} />} title="Fast Delivery" sub="Across Ghana" />
      <TrustItem icon={<Headphones size={20} />} title="Support" sub="We're here to help" />
    </div></Container></section>

    <section className="bg-white py-8 sm:py-10"><Container size="xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold sm:text-xl">Shop by Category</h2><Link href="/categories" className="hidden text-sm font-medium text-[#0f2b5b] sm:inline">View all</Link></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.slice(0, 10).map((cat) => <Link key={cat.id} href={`/categories/${cat.slug}`} className="group overflow-hidden rounded-xl">
          <CategoryVisual slug={cat.slug} className="transition-transform duration-300 group-hover:scale-[1.02]" />
          <p className="mt-2 line-clamp-1 text-xs font-semibold text-gray-700 group-hover:text-[#0f2b5b] sm:text-sm">{cat.name}</p>
        </Link>)}
      </div>
    </Container></section>

    <PromoBanners banners={PROMO_BANNERS} />
    <ProductSection title="Popular Products" subtitle="Best-selling items on our marketplace" href="/products?sort=popular" products={featuredProducts} emptyTitle="Products coming soon" emptyDescription="Verified sellers will be listing products here." categories={categories} />

    {categories.slice(0, 3).map(async (cat) => {
      const result = await getProducts({ categorySlug: cat.slug, pageSize: 4 });
      return result.products.length ? <section key={cat.id} className="border-t border-gray-100 bg-gray-50/50 py-8"><Container size="xl"><SectionHeader title={cat.name} subtitle={`Browse ${cat.name.toLowerCase()} products`} href={`/categories/${cat.slug}`} /><ProductGrid products={result.products} /></Container></section> : null;
    })}

    <section className="border-y border-gray-100 bg-gray-50"><FeaturedStores stores={FEATURED_STORES} /></section>
    <ProductSection title="New Arrivals" subtitle="Recently added products" href="/products?sort=newest" products={newestProducts} emptyTitle="No products yet" emptyDescription="New products appear after seller approval." categories={categories} />
    {topRatedProducts.length > 0 && <section className="border-t border-gray-100 bg-gray-50/50 py-8"><Container size="xl"><SectionHeader title="Top Rated" subtitle="Products with the best reviews" href="/products?sort=rating" /><ProductGrid products={topRatedProducts} /></Container></section>}
    {moreProducts.products.length > 0 && <ProductSection title="More to Love" subtitle="Discover something great" href="/products" products={moreProducts.products} categories={categories} />}

    <section className="relative overflow-hidden" style={{ backgroundColor: brand.colors.primary }}><Container size="lg"><div className="py-12 text-center sm:py-16"><h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Grow Your Business With Us</h2><p className="mx-auto mb-8 max-w-xl text-sm text-white/70">Join verified sellers reaching customers across Ghana.</p><Link href="/seller/apply"><Button size="lg" className="bg-white font-semibold" style={{ color: brand.colors.primary }}>Start Selling <ArrowRight size={18} /></Button></Link></div></Container></section>
  </>;
}

function ProductSection({ title, subtitle, href, products, emptyTitle, emptyDescription, categories }: { title: string; subtitle: string; href: string; products: import('@/lib/queries/products').ProductWithRelations[]; emptyTitle?: string; emptyDescription?: string; categories: import('@/lib/queries/categories').CategoryWithSubcategories[] }) {
  return <section className="bg-white py-8 sm:py-10"><Container size="xl"><SectionHeader title={title} subtitle={subtitle} href={href} />{products.length ? <ProductGrid products={products} /> : emptyTitle ? <div className="space-y-5"><div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-8 text-center"><h3 className="text-lg font-semibold">{emptyTitle}</h3><p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{emptyDescription || ''}</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><>{categories.slice(0, 4).map((cat) => <Link key={cat.id} href={`/categories/${cat.slug}`}><CategoryVisual slug={cat.slug} /></Link>)}</></div></div> : null}</Container></section>;
}

function TrustItem({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) { return <div className="flex items-center justify-center gap-3 px-4 py-3 sm:px-6"><div className="text-[#0f2b5b]">{icon}</div><div><p className="text-xs font-semibold sm:text-sm">{title}</p><p className="text-[10px] text-gray-500 sm:text-xs">{sub}</p></div></div>; }
function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href: string }) { return <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold sm:text-xl">{title}</h2>{subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}</div><Link href={href} className="hidden items-center gap-1 text-sm font-medium text-[#0f2b5b] sm:inline-flex">View all <ArrowRight size={14} /></Link></div>; }
