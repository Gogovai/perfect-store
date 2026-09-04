import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { ProductGrid } from '@/components/products/ProductGrid';
import { getSellerBySlug } from '@/lib/queries/sellers';
import { createClient } from '@/lib/supabase/server';
import { APP_NAME } from '@/config/constants';
import { Star, Package, Mail, Phone, ChevronRight, ShieldCheck } from 'lucide-react';

interface SellerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const seller = await getSellerBySlug(slug);
  if (!seller) return { title: 'Store Not Found' };
  return {
    title: `${seller.store_name} - ${APP_NAME}`,
    description: seller.description || `Shop from ${seller.store_name} on ${APP_NAME}`,
    openGraph: { title: seller.store_name, description: seller.description || '', type: 'website' },
  };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SellerDetailPage({ params }: SellerPageProps) {
  const { slug } = await params;

  // Old call sites linked stores by UUID. Resolve those to the canonical
  // slug URL; anything else that does not match a store 404s.
  if (UUID_PATTERN.test(slug)) {
    const supabase = await createClient();
    const { data: byId } = await supabase
      .from('sellers')
      .select('slug')
      .eq('id', slug)
      .eq('status', 'active')
      .maybeSingle();
    if (byId?.slug && byId.slug !== slug) redirect(`/sellers/${byId.slug}`);
  }

  const seller = await getSellerBySlug(slug);
  if (!seller) notFound();

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <Container size="xl">
          <nav className="flex items-center gap-1 py-3 text-sm text-gray-500 overflow-x-auto" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-gray-900 shrink-0">Home</Link>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
            <Link href="/sellers" className="hover:text-gray-900 shrink-0">Stores</Link>
            <ChevronRight size={14} className="text-gray-300 shrink-0" />
            <span className="text-gray-900 font-medium truncate">{seller.store_name}</span>
          </nav>
        </Container>
      </div>

      {/* Store banner */}
      <div className="relative h-40 sm:h-52 md:h-64 overflow-hidden bg-gradient-to-r from-[#0f2b5b] to-[#1d4d78]">
        {seller.banner_url ? (
          <Image src={seller.banner_url} alt={`${seller.store_name} banner`} fill className="object-cover" sizes="100vw" priority />
        ) : (
          <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 75% 35%, white 0, transparent 35%)' }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Store info card */}
      <Container size="xl">
        <div className="relative -mt-16 mb-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Logo */}
              <div className="relative -mt-12 sm:-mt-14 shrink-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden">
                  {seller.logo_url ? (
                    <Image src={seller.logo_url} alt={seller.store_name} width={96} height={96} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#0f2b5b] text-white text-2xl font-bold">
                      {seller.store_name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{seller.store_name}</h1>
                  <ShieldCheck size={18} className="text-[#0f2b5b] shrink-0" />
                </div>
                {seller.description && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">{seller.description}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Package size={14} />
                    <span>{seller.productCount} products</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span>Verified Seller</span>
                  </div>
                  {seller.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} />
                      <span>{seller.phone}</span>
                    </div>
                  )}
                  {seller.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail size={14} />
                      <span>{seller.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="shrink-0">
                <Link
                  href={`/search?q=${encodeURIComponent(seller.store_name)}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0f2b5b] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a3d7c]"
                >
                  View All Products
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="pb-12">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold sm:text-xl">Products by {seller.store_name}</h2>
              <p className="mt-0.5 text-sm text-gray-500">{seller.productCount} products available</p>
            </div>
          </div>

          {seller.products.length > 0 ? (
            <ProductGrid products={seller.products} />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center">
              <Package size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-semibold text-gray-900">No products yet</p>
              <p className="mt-1 text-sm text-gray-500">This store hasn&apos;t listed any products yet. Check back soon.</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
