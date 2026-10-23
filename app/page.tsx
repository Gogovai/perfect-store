import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { PromoBanners } from '@/components/home/PromoBanners';
import { getFeaturedProducts, getNewestProducts, getTopRatedProducts } from '@/lib/queries/products';
import { HERO_SLIDES, PROMO_BANNERS } from '@/lib/data/storefront-content';
import { brand } from '@/config/brand';
import { ArrowRight, CreditCard, Truck, Headphones, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = { title: `${brand.name} — Clothing Store`, description: brand.description };

export default async function Home() {
  const [featuredProducts, newestProducts, topRatedProducts] = await Promise.all([
    getFeaturedProducts(8),
    getNewestProducts(8),
    getTopRatedProducts(8),
  ]);

  return (
    <>
      <HeroCarousel slides={HERO_SLIDES} />

      {/* Trust badges */}
      <section className="border-b border-gray-100 bg-white">
        <Container size="xl">
          <div className="grid grid-cols-2 divide-x divide-gray-100 lg:grid-cols-4">
            <TrustItem icon={<CreditCard size={20} />} title="Secure Payment" sub="Protected checkout" />
            <TrustItem icon={<ShieldCheck size={20} />} title="Quality Fashion" sub="Selected for your style" />
            <TrustItem icon={<Truck size={20} />} title="Fast Delivery" sub="Across Ghana" />
            <TrustItem icon={<Headphones size={20} />} title="Customer Support" sub="Help with your order" />
          </div>
        </Container>
      </section>

      {/* Promotional banners */}
      <PromoBanners banners={PROMO_BANNERS} />

      {/* Product cards stay visible; no category navigation or category-based sections */}
      {featuredProducts.length > 0 && (
        <section className="bg-white py-8 sm:py-10">
          <Container size="xl">
            <SectionHeader title="Featured Products" subtitle="Selected pieces from our collection" href="/products" />
            <ProductGrid products={featuredProducts} />
          </Container>
        </section>
      )}

      <section className="bg-gray-50/50 py-8 sm:py-10">
        <Container size="xl">
          <SectionHeader title="New Arrivals" subtitle="Recently added products" href="/products?sort=newest" />
          {newestProducts.length > 0 ? (
            <ProductGrid products={newestProducts} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">New products will appear here soon.</p>
          )}
        </Container>
      </section>

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
            <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">Find Your Next Favourite Outfit</h2>
            <p className="mx-auto mb-8 max-w-xl text-sm text-white/70">Explore men’s and women’s fashion, choose your style, and order for delivery anywhere in Ghana.</p>
            <Link href="/products">
              <Button size="lg" className="bg-white font-semibold" style={{ color: brand.colors.primary }}>Shop Clothing <ArrowRight size={18} /></Button>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
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
