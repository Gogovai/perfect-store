'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { HeroSlide } from '@/lib/data/campaigns';

interface HeroCarouselProps {
  slides: HeroSlide[];
  autoPlayMs?: number;
}

export function HeroCarousel({ slides, autoPlayMs = 5000 }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-rotation
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(next, autoPlayMs);
    return () => clearInterval(timer);
  }, [isPaused, next, autoPlayMs, slides.length]);

  const slide = slides[current];
  if (!slide) return null;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: slide.bgColor }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Promotional carousel"
      aria-roledescription="carousel"
    >
      {/* Background image */}
      <div className="relative h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px]">
        <Image
          src={slide.imageUrl}
          alt={slide.headline}
          fill
          className="object-cover"
          sizes="100vw"
          priority={current === 0}
        />
        {/* Overlay gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${slide.bgColor}ee 0%, ${slide.bgColor}cc 40%, transparent 100%)`,
          }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-lg">
              <h2
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
                style={{ color: slide.textColor }}
              >
                {slide.headline}
              </h2>
              <p
                className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg opacity-90"
                style={{ color: slide.textColor }}
              >
                {slide.subtext}
              </p>
              <Link href={slide.ctaLink} className="inline-block mt-5 sm:mt-6">
                <Button
                  size="lg"
                  className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                >
                  {slide.ctaText}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Slide indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === current
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
