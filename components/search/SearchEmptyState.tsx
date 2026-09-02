import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

const previews = [
  {
    label: 'Phones',
    href: '/categories/phones-tablets',
    image:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=85',
  },
  {
    label: 'Fashion',
    href: '/categories/fashion',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=85',
  },
  {
    label: 'Tech',
    href: '/categories/computers-accessories',
    image:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=85',
  },
];

export function SearchEmptyState() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-12 text-center sm:py-16">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#0f2b5b]/8">
        <Search size={28} className="text-[#0f2b5b]" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">Search for products</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Enter a search term above to find products from our marketplace.
      </p>

      <div className="mt-8 grid w-full grid-cols-3 gap-3 sm:gap-4">
        {previews.map((preview) => (
          <Link
            key={preview.label}
            href={preview.href}
            className="group relative h-32 overflow-hidden rounded-xl sm:h-40"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${preview.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <span className="absolute inset-x-0 bottom-3 text-sm font-semibold text-white drop-shadow">
              {preview.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
