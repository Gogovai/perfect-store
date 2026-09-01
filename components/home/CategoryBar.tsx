import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { getCategoryImage } from '@/lib/data/campaigns';
import type { Category } from '@/lib/queries/categories';

interface CategoryBarProps {
  categories: Category[];
}

export function CategoryBar({ categories }: CategoryBarProps) {
  if (categories.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      <Container size="xl">
        <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide py-3">
          {categories.map((category) => {
            const imageUrl = getCategoryImage(category.slug, category.icon);
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-blue-500 transition-colors">
                  <Image
                    src={imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <span className="text-[11px] sm:text-xs text-gray-700 font-medium text-center whitespace-nowrap group-hover:text-blue-600 transition-colors">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </div>
  );
}
