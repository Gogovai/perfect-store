import React from 'react';
import { PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface ProductEmptyStateProps {
  title?: string;
  description?: string;
  showBrowseButton?: boolean;
}

export function ProductEmptyState({
  title = 'No products found',
  description = 'We couldn\'t find any products matching your criteria. Try adjusting your filters or search terms.',
  showBrowseButton = true,
}: ProductEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <PackageSearch size={32} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {showBrowseButton && (
        <Link href="/categories">
          <Button variant="outline" size="sm">
            Browse Categories
          </Button>
        </Link>
      )}
    </div>
  );
}
