import React from 'react';
import { PackageSearch, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface ProductEmptyStateProps {
  title?: string;
  description?: string;
  showBrowseButton?: boolean;
}

export function ProductEmptyState({
  title = 'No products found',
  description = 'Try adjusting your filters or browse our categories to find what you need.',
  showBrowseButton = true,
}: ProductEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#0f2b5b]/10 to-[#e85d26]/10 flex items-center justify-center mb-4">
        <PackageSearch size={32} className="text-[#0f2b5b]/60" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {showBrowseButton && (
        <div className="flex gap-3">
          <Link href="/categories">
            <Button variant="outline" size="sm">
              Browse Categories
            </Button>
          </Link>
          <Link href="/">
            <Button size="sm">
              Back to Home <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
