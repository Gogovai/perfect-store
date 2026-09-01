'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterGroup({ title, children, defaultOpen = true }: FilterGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 pb-4 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

interface ProductFiltersProps {
  categories?: FilterOption[];
}

interface FiltersContentProps {
  categories: FilterOption[];
  currentSort: string;
  currentMinPrice: string;
  currentMaxPrice: string;
  currentCategory: string;
  currentRating: string;
  updateParams: (key: string, value: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

function FiltersContent({
  categories,
  currentSort,
  currentMinPrice,
  currentMaxPrice,
  currentCategory,
  currentRating,
  updateParams,
  clearAllFilters,
  hasActiveFilters,
}: FiltersContentProps) {
  const sortOptions: FilterOption[] = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Most Reviewed', value: 'most_reviewed' },
    { label: 'Most Popular', value: 'popular' },
  ];

  return (
    <div className="space-y-6">
      {/* Sort */}
      <FilterGroup title="Sort By">
        <select
          value={currentSort}
          onChange={(e) => updateParams('sort', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Sort products"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Categories */}
      {categories.length > 0 && (
        <FilterGroup title="Category">
          <div className="space-y-2">
            <button
              onClick={() => updateParams('category', '')}
              className={`block w-full text-left text-sm px-2 py-1 rounded transition-colors ${
                !currentCategory
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => updateParams('category', cat.value)}
                className={`block w-full text-left text-sm px-2 py-1 rounded transition-colors ${
                  currentCategory === cat.value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* Price Range */}
      <FilterGroup title="Price Range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={currentMinPrice}
            onChange={(e) => updateParams('minPrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            aria-label="Minimum price"
          />
          <span className="text-gray-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={currentMaxPrice}
            onChange={(e) => updateParams('maxPrice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            aria-label="Maximum price"
          />
        </div>
      </FilterGroup>

      {/* Rating */}
      <FilterGroup title="Rating">
        <div className="space-y-1">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => updateParams('rating', currentRating === String(r) ? '' : String(r))}
              className={`flex items-center gap-2 w-full text-sm px-2 py-1 rounded transition-colors ${
                currentRating === String(r)
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-amber-400">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
              <span>& up</span>
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full text-sm text-red-600 hover:text-red-700 font-medium py-2"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

export function ProductFilters({ categories = [] }: ProductFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentRating = searchParams.get('rating') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  const sortOptions: FilterOption[] = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Highest Rated', value: 'rating' },
    { label: 'Most Reviewed', value: 'most_reviewed' },
    { label: 'Most Popular', value: 'popular' },
  ];

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function clearAllFilters() {
    const params = new URLSearchParams(searchParams.toString());
    ['minPrice', 'maxPrice', 'category', 'rating'].forEach((key) => params.delete(key));
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const hasActiveFilters = !!(currentMinPrice || currentMaxPrice || currentCategory || currentRating);

  const filterProps = {
    categories,
    currentSort,
    currentMinPrice,
    currentMaxPrice,
    currentCategory,
    currentRating,
    updateParams,
    clearAllFilters,
    hasActiveFilters,
  };

  return (
    <>
      {/* Mobile filter trigger */}
      <div className="lg:hidden flex items-center gap-3 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="gap-2"
        >
          <SlidersHorizontal size={16} />
          Filters
        </Button>
        <select
          value={currentSort}
          onChange={(e) => updateParams('sort', e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Sort products"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Mobile filter drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <FiltersContent {...filterProps} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <FiltersContent {...filterProps} />
      </div>
    </>
  );
}
