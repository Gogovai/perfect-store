'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import type { Tables } from '@/types/database';

type ProductImage = Tables<'product_images'>;

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square bg-white rounded-xl border border-gray-200 flex items-center justify-center">
        <span className="text-gray-400">No image available</span>
      </div>
    );
  }

  const selectedImage = images[selectedIndex] || images[0];

  function prevImage() {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  function nextImage() {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        className="relative aspect-square bg-white rounded-xl border border-gray-200 overflow-hidden group cursor-zoom-in"
        onClick={() => setIsZoomed(!isZoomed)}
      >
        <Image
          src={selectedImage.url}
          alt={selectedImage.alt_text || productName}
          fill
          className={`object-contain p-4 transition-transform duration-300 ${
            isZoomed ? 'scale-150' : 'group-hover:scale-105'
          }`}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        {/* Zoom indicator */}
        <div className="absolute bottom-3 right-3 h-8 w-8 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={16} className="text-white" />
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-3 h-6 bg-black/40 rounded-full px-2.5 flex items-center text-white text-xs font-medium">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {images.map((img, index) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                index === selectedIndex
                  ? 'border-blue-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={img.url}
                alt={img.alt_text || `${productName} ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
