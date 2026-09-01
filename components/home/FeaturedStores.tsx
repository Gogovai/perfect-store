import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Star, ChevronRight } from 'lucide-react';
import type { FeaturedStore } from '@/lib/data/campaigns';

interface FeaturedStoresProps {
  stores: FeaturedStore[];
}

export function FeaturedStores({ stores }: FeaturedStoresProps) {
  if (stores.length === 0) return null;

  return (
    <section className="py-8 sm:py-12">
      <Container size="xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Featured Stores</h2>
            <p className="text-sm text-gray-500 mt-1">Shop from our top-rated sellers</p>
          </div>
          <Link
            href="/sellers"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all stores <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/sellers/${store.slug}`}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Banner */}
              <div className="relative h-24 sm:h-28 overflow-hidden bg-gray-100">
                <Image
                  src={store.bannerUrl}
                  alt={`${store.name} banner`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="200px"
                />
              </div>

              {/* Logo + Info */}
              <div className="relative px-3 pb-3">
                <div className="relative -mt-5 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-white border-2 border-white shadow-sm overflow-hidden">
                    <Image
                      src={store.logoUrl}
                      alt={store.name}
                      width={40}
                      height={40}
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {store.name}
                </h3>

                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-medium text-gray-700">{store.rating}</span>
                  </div>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{store.productCount} items</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
