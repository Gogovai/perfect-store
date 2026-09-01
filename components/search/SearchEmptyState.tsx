import React from 'react';
import { Search } from 'lucide-react';

export function SearchEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Search size={32} className="text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Search for products</h3>
      <p className="text-sm text-gray-500 max-w-sm">
        Enter a search term above to find products from our marketplace.
      </p>
    </div>
  );
}
