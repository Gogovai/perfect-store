'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Flame, ChevronRight, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils/formatting';
import type { FlashSaleItem } from '@/lib/data/campaigns';

interface FlashSaleProps {
  items: FlashSaleItem[];
  endsAt?: Date;
}

function CountdownTimer({ endsAt }: { endsAt: Date }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function update() {
      const diff = Math.max(0, endsAt.getTime() - Date.now());
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  function pad(n: number) {
    return n.toString().padStart(2, '0');
  }

  return (
    <div className="flex items-center gap-1.5">
      <Clock size={14} className="text-white/70" />
      <span className="font-mono text-sm font-bold text-white bg-white/20 px-2 py-0.5 rounded">
        {pad(timeLeft.hours)}
      </span>
      <span className="text-white/70">:</span>
      <span className="font-mono text-sm font-bold text-white bg-white/20 px-2 py-0.5 rounded">
        {pad(timeLeft.minutes)}
      </span>
      <span className="text-white/70">:</span>
      <span className="font-mono text-sm font-bold text-white bg-white/20 px-2 py-0.5 rounded">
        {pad(timeLeft.seconds)}
      </span>
    </div>
  );
}

export function FlashSale({ items, endsAt }: FlashSaleProps) {
  // Default: ends at midnight tonight
  const endDate = endsAt || new Date(new Date().setHours(23, 59, 59, 999));

  if (items.length === 0) return null;

  return (
    <section className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 py-6 sm:py-8">
      <Container size="xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Flame size={24} className="text-white" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Flash Sale</h2>
            </div>
            <CountdownTimer endsAt={endDate} />
          </div>
          <Link
            href="/search?sort=popular"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white"
          >
            View All <ChevronRight size={16} />
          </Link>
        </div>

        {/* Horizontal scroll */}
        <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/products/${item.slug}`}
              className="group shrink-0 w-[140px] sm:w-[180px] bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-50">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="180px"
                />
                {/* Discount badge */}
                <div className="absolute top-1 left-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  -{item.discountPercent}%
                </div>
              </div>

              {/* Info */}
              <div className="p-2 sm:p-3">
                <p className="text-xs font-bold text-red-600">{formatPrice(item.salePrice)}</p>
                <p className="text-[10px] text-gray-400 line-through">{formatPrice(item.originalPrice)}</p>
                <p className="text-xs text-gray-700 mt-1 line-clamp-2 leading-tight">{item.name}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile view all */}
        <div className="sm:hidden mt-4 text-center">
          <Link href="/search?sort=popular">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              View All Deals <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
