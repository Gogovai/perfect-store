import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { getAllSellers } from '@/lib/queries/sellers';
import { APP_NAME } from '@/config/constants';
import { Star, Package, ShieldCheck, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: `Stores - ${APP_NAME}`,
  description: `Browse all verified stores on ${APP_NAME} marketplace`,
};

export default async function SellersPage() {
  const sellers = await getAllSellers();

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 py-6 sm:py-8">
      <Container size="xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <ChevronRight size={14} className="text-gray-300" />
          <span className="text-gray-900 font-medium">Stores</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Stores</h1>
          <p className="mt-2 text-gray-600">Shop from verified sellers across Ghana</p>
        </div>

        {sellers.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-lg font-semibold text-gray-900">No stores available</p>
            <p className="mt-1 text-sm text-gray-500">Check back soon for new sellers.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sellers.map((seller) => (
              <Link
                key={seller.id}
                href={`/sellers/${seller.slug}`}
                className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
              >
                {/* Banner */}
                <div className="relative h-28 sm:h-32 overflow-hidden bg-gradient-to-r from-[#0f2b5b] to-[#1d4d78]">
                  {seller.banner_url ? (
                    <Image src={seller.banner_url} alt={`${seller.store_name} banner`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="400px" />
                  ) : (
                    <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 75% 35%, white 0, transparent 35%)' }} />
                  )}
                </div>

                {/* Content */}
                <div className="relative px-4 pb-4">
                  <div className="relative -mt-6 mb-3">
                    <div className="h-12 w-12 rounded-xl border-2 border-white bg-white shadow-sm overflow-hidden">
                      {seller.logo_url ? (
                        <Image src={seller.logo_url} alt={seller.store_name} width={48} height={48} className="h-full w-full object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#0f2b5b] text-white text-sm font-bold">
                          {seller.store_name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#0f2b5b] transition-colors truncate">
                      {seller.store_name}
                    </h3>
                    <ShieldCheck size={14} className="text-[#0f2b5b] shrink-0" />
                  </div>

                  {seller.description && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{seller.description}</p>
                  )}

                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
