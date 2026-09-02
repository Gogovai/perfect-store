import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Store, ArrowLeft } from 'lucide-react';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Container } from '@/components/layout/Container';
import { getPublicSellerBySlug, getPublicSellerProducts } from '@/lib/queries/sellers';

export const dynamic = 'force-dynamic';

interface StorePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const seller = await getPublicSellerBySlug(slug);

  if (!seller) notFound();

  const { products, total, hasMore } = await getPublicSellerProducts(seller.id, page);

  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-6 sm:py-8">
        <Link href="/products" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#0f2b5b]">
          <ArrowLeft size={16} /> Back to products
        </Link>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="relative h-36 bg-gradient-to-r from-[#0f2b5b] to-[#183d78] sm:h-48">
            {seller.banner_url && (
              <Image src={seller.banner_url} alt={`${seller.store_name} storefront banner`} fill className="object-cover" priority />
            )}
          </div>
          <div className="relative px-5 pb-6 sm:px-8">
            <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gray-100 shadow-sm sm:h-24 sm:w-24">
                  {seller.logo_url ? (
                    <Image src={seller.logo_url} alt={`${seller.store_name} logo`} fill className="object-cover" />
                  ) : (
                    <Store className="text-gray-400" size={32} />
                  )}
                </div>
                <div className="pb-1">
                  <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{seller.store_name}</h1>
                  <p className="text-sm text-gray-500">{total} active product{total === 1 ? '' : 's'}</p>
                </div>
              </div>
            </div>
            {seller.description && <p className="mt-5 max-w-3xl text-sm leading-6 text-gray-600">{seller.description}</p>}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Store products</h2>
              <p className="mt-1 text-sm text-gray-500">Shop products sold by {seller.store_name}.</p>
            </div>
          </div>

          {products.length ? (
            <ProductGrid products={products} />
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
              <Store className="mx-auto text-gray-300" size={42} strokeWidth={1.5} />
              <h3 className="mt-4 font-semibold text-gray-900">No products available</h3>
              <p className="mt-1 text-sm text-gray-500">This seller has not published any products yet.</p>
            </div>
          )}

          {(page > 1 || hasMore) && (
            <div className="mt-8 flex items-center justify-center gap-3">
              {page > 1 && <Link href={`/stores/${seller.slug}?page=${page - 1}`} className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold">Previous</Link>}
              {hasMore && <Link href={`/stores/${seller.slug}?page=${page + 1}`} className="rounded-lg bg-[#0f2b5b] px-4 py-2 text-sm font-semibold text-white">Next</Link>}
            </div>
          )}
        </section>
      </Container>
    </main>
  );
}
