'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import type { CategoryWithSubcategories } from '@/lib/queries/categories';

interface CategoryNavigationProps {
  categories: CategoryWithSubcategories[];
  currentSlug?: string;
}

export function CategoryNavigation({ categories }: CategoryNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Category navigation">
      <ul className="space-y-1">
        {categories.map((category) => {
          const isActive =
            pathname === `/categories/${category.slug}` ||
            category.subcategories?.some(
              (sub) => pathname === `/categories/${sub.slug}`
            );

          return (
            <li key={category.id}>
              <Link
                href={`/categories/${category.slug}`}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="truncate">{category.name}</span>
                {category.subcategories && category.subcategories.length > 0 && (
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                )}
              </Link>

              {/* Subcategories */}
              {category.subcategories && category.subcategories.length > 0 && isActive && (
                <ul className="ml-4 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                  {category.subcategories.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/categories/${sub.slug}`}
                        className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          pathname === `/categories/${sub.slug}`
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
