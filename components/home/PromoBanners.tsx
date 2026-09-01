import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import type { PromoBanner } from '@/lib/data/campaigns';

interface PromoBannersProps {
  banners: PromoBanner[];
}

export function PromoBanners({ banners }: PromoBannersProps) {
  if (banners.length === 0) return null;

  return (
    <section className="py-6 sm:py-8">
      <Container size="xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((banner) => (
            <Link
              key={banner.id}
              href={banner.ctaLink}
              className="group relative h-40 sm:h-48 rounded-xl overflow-hidden"
              style={{ backgroundColor: banner.bgColor }}
            >
              {/* Background image */}
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className="object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />

              {/* Content overlay */}
              <div className="absolute inset-0 flex items-center p-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {banner.title}
                  </h3>
                  <p className="text-sm text-white/80 mb-3">{banner.description}</p>
                  <span className="inline-flex items-center text-sm font-semibold text-white bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg group-hover:bg-white/30 transition-colors">
                    {banner.ctaText}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
