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
import { getFeaturedProducts, getNewestProducts, getTopRatedProducts, getProducts, getActiveProductSellerCounts } from '@/lib/queries/products';
import { getCategories } from '@/lib/queries/categories';
import { getAllSellers } from '@/lib/queries/sellers';
import { HERO_SLIDES, PROMO_BANNERS } from '@/lib/data/campaigns';
import { getFlashSaleWindow } from '@/lib/data/flash-sale';
import { brand } from '@/config/brand';
import { ArrowRight, CreditCard, Truck, Headphones, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = { title: `${brand.name} — Online Marketplace`, description: brand.description };

export default async function Home() {
  const [featuredProducts, newestProducts, topRatedProducts, categories, popularProducts, sellers, sellerCounts, flashProducts] = await Promise.all([
    getFeaturedProducts(8),
    getNewestProducts(8),
    getTopRatedProducts(8),
    getCategories(),
    getProducts({ sort: 'popular', page: 1, pageSize: 8 }),
    getAllSellers(),
    getActiveProductSellerCounts(),
    getProducts({ pageSize: 100 }),
  ]);

  // Flash sale built from real catalogue products so every card links to a
  // live product page. Renders nothing when the catalogue is empty.
  const flashSale = getFlashSaleWindow(
    flashProducts.products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      imageUrl: p.product_images.find((img) => img.is_primary)?.url ?? p.product_images[0]?.url ?? '',
      price: p.base_price,
    }))
  );

  const featuredStores = sellers.map((s) => ({
    id: s.id,
    name: s.store_name,
    slug: s.slug,
    logoUrl: s.logo_url,
    bannerUrl: s.banner_url,
    productCount: sellerCounts[s.id] ?? 0,
    rating: null,
  }));

  const catSections = await Promise.all(
    categories.slice(0, 4).map(async (cat) => {
      const result = await getProducts({ categorySlug: cat.slug, pageSize: 4 });
      return { category: cat, products: result.products };
    })
  );

  return <>
    <CategoryBar categories={categories.slice(0, 12)} />
    <HeroCarousel slides={HERO_SLIDES} />
    <FlashSale
      items={flashSale.items}
      endsAt={flashSale.endsAt}
      initialSecondsLeft={flashSale.secondsLeft}
    />

    {/* Trust badges */}
    <section className="border-b border-gray-100 bg-white">
      <Container size="xl">
        <div className="grid grid-cols-2 divide-x divide-gray-100 lg:grid-cols-4">
          <TrustItem icon={<CreditCard size={20} />} title="Secure Payment" sub="Protected checkout" />
          <TrustItem icon={<ShieldCheck size={20} />} title="Quality Products" sub="Verified sellers" />
          <TrustItem icon={<Truck size={20} />} title="Fast Delivery" sub="Across Ghana" />
          <TrustItem icon={<Headphones size={20} />} title="24/7 Support" sub="We're here to help" />
        </div>
      </Container>
    </section>

    {/* Shop by Category — single image per card, no text below */}
    <section className="bg-white py-8 sm:py-10">
      <Container size="xl">
        <SectionHeader title="Shop by Category" href="/categories" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {categories.slice(0, 12).map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.slug}`}>
              <CategoryVisual slug={cat.slug} />
            </Link>
          ))}
        </div>
      </Container>
    </section>

    {/* Promo Banners */}
    <PromoBanners banners={PROMO_BANNERS} />

    {/* Popular Products */}
    <section className="bg-white py-8 sm:py-10">
      <Container size="xl">
        <SectionHeader title="Popular Products" subtitle="Best-selling items on our marketplace" href="/products?sort=popular" />
        {featuredProducts.length > 0 ? (
          <ProductGrid products={featuredProducts} />
        ) : popularProducts.products.length > 0 ? (
          <ProductGrid products={popularProducts.products} />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {categories.slice(0, 5).map((cat) => (
              <Link key={cat.id} href={`/categories/${cat.slug}`}>
                <CategoryVisual slug={cat.slug} />
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>

    {/* Category product rows */}
    {catSections.map(({ category, products }) =>
      products.length > 0 ? (
        <section key={category.id} className="border-t border-gray-100 bg-gray-50/50 py-8">
          <Container size="xl">
            <SectionHeader title={category.name} subtitle={`Browse ${category.name.toLowerCase()} products`} href={`/categories/${category.slug}`} />
            <ProductGrid products={products} />
          </Container>
        </section>
      ) : null
    )}

    {/* Featured Stores */}
    <section className="border-y border-gray-100 bg-white py-8 sm:py-10">
      <FeaturedStores stores={featuredStores} />
    </section>

    {/* New Arrivals */}
    <section className="bg-gray-50/50 py-8 sm:py-10">
      <Container size="xl">
        <SectionHeader title="New Arrivals" subtitle="Recently added products" href="/products?sort=newest" />
        {newestProducts.length > 0 ? (
          <ProductGrid products={newestProducts} />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {categories.slice(0, 5).map((cat) => (
              <Link key={cat.id} href={`/categories/${cat.slug}`}>
                <CategoryVisual slug={cat.slug} />
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>

    {/* Top Rated */}
    {topRatedProducts.length > 0 && (
      <section className="border-t border-gray-100 bg-white py-8 sm:py-10">
        <Container size="xl">
          <SectionHeader title="Top Rated" subtitle="Products with the best reviews" href="/products?sort=rating" />
          <ProductGrid products={topRatedProducts} />
        </Container>
      </section>
    )}

    {/* CTA */}
    <section className="relative overflow-hidden" style={{ backgroundColor: brand.colors.primary }}>
      <Container size="lg">
        <div className="py-12 text-center sm:py-16">
          <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Grow Your Business With Us</h2>
          <p className="mx-auto mb-8 max-w-xl text-sm text-white/70">Join verified sellers reaching customers across Ghana.</p>
          <Link href="/seller/apply">
            <Button size="lg" className="bg-white font-semibold" style={{ color: brand.colors.primary }}>Start Selling <ArrowRight size={18} /></Button>
          </Link>
        </div>
      </Container>
    </section>
  </>;
}

function TrustItem({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-3 sm:px-6">
      <div className="text-[#0f2b5b]">{icon}</div>
      <div>
        <p className="text-xs font-semibold sm:text-sm">{title}</p>
        <p className="text-[10px] text-gray-500 sm:text-xs">{sub}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href: string }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-bold sm:text-xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      <Link href={href} className="hidden items-center gap-1 text-sm font-medium text-[#0f2b5b] sm:inline-flex">
        View all <ArrowRight size={14} />
      </Link>
    </div>
  );
}
