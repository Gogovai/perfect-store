import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import type { Category } from '@/lib/queries/categories';

interface CategoryBreadcrumbProps {
  breadcrumbs: Category[];
}

export function CategoryBreadcrumb({ breadcrumbs }: CategoryBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-gray-500 overflow-x-auto">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-gray-900 transition-colors shrink-0"
      >
        <Home size={14} />
        <span className="hidden sm:inline">Home</span>
      </Link>
      <ChevronRight size={14} className="text-gray-300 shrink-0" />
      <Link href="/categories" className="hover:text-gray-900 transition-colors shrink-0">
        Categories
      </Link>
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.id}>
          <ChevronRight size={14} className="text-gray-300 shrink-0" />
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium truncate">{crumb.name}</span>
          ) : (
            <Link
              href={`/categories/${crumb.slug}`}
              className="hover:text-gray-900 transition-colors truncate"
            >
              {crumb.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
