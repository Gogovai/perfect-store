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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
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
  sellers?: FilterOption[];
}

interface FiltersContentProps {
  categories: FilterOption[];
  sellers: FilterOption[];
  currentSort: string;
  currentMinPrice: string;
  currentMaxPrice: string;
  currentCategory: string;
  currentSeller: string;
  currentRating: string;
  updateParams: (key: string, value: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

function FiltersContent({
  categories,
  sellers,
  currentSort,
  currentMinPrice,
  currentMaxPrice,
  currentCategory,
  currentSeller,
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
      <FilterGroup title="Sort By">
        <select
          value={currentSort}
          onChange={(e) => updateParams('sort', e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Sort products"
        >
          {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </FilterGroup>

      {categories.length > 0 && (
        <FilterGroup title="Category">
          <div className="space-y-2">
            <button type="button" onClick={() => updateParams('category', '')} className={`block w-full rounded px-2 py-1 text-left text-sm transition-colors ${!currentCategory ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
              All Categories
            </button>
            {categories.map((cat) => (
              <button type="button" key={cat.value} onClick={() => updateParams('category', cat.value)} className={`block w-full rounded px-2 py-1 text-left text-sm transition-colors ${currentCategory === cat.value ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </FilterGroup>
      )}

      {sellers.length > 0 && (
        <FilterGroup title="Seller">
          <select
            value={currentSeller}
            onChange={(e) => updateParams('seller', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by seller"
          >
            <option value="">All Sellers</option>
            {sellers.map((seller) => <option key={seller.value} value={seller.value}>{seller.label}</option>)}
          </select>
        </FilterGroup>
      )}

      <FilterGroup title="Price Range">
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={currentMinPrice} onChange={(e) => updateParams('minPrice', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" aria-label="Minimum price" />
          <span className="text-gray-400">—</span>
          <input type="number" placeholder="Max" value={currentMaxPrice} onChange={(e) => updateParams('maxPrice', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" min="0" aria-label="Maximum price" />
        </div>
      </FilterGroup>

      <FilterGroup title="Rating">
        <div className="space-y-1">
          {[4, 3, 2, 1].map((r) => (
            <button type="button" key={r} onClick={() => updateParams('rating', currentRating === String(r) ? '' : String(r))} className={`flex w-full items-center gap-2 rounded px-2 py-1 text-sm transition-colors ${currentRating === String(r) ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}>
              <span className="text-amber-400">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span><span>& up</span>
            </button>
          ))}
        </div>
      </FilterGroup>

      {hasActiveFilters && (
        <button type="button" onClick={clearAllFilters} className="w-full py-2 text-sm font-medium text-red-600 hover:text-red-700">Clear all filters</button>
      )}
    </div>
  );
}

export function ProductFilters({ categories = [], sellers = [] }: ProductFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentSeller = searchParams.get('seller') || '';
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
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function clearAllFilters() {
    const params = new URLSearchParams(searchParams.toString());
    ['minPrice', 'maxPrice', 'category', 'seller', 'rating'].forEach((key) => params.delete(key));
    params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const hasActiveFilters = !!(currentMinPrice || currentMaxPrice || currentCategory || currentSeller || currentRating);
  const filterProps = { categories, sellers, currentSort, currentMinPrice, currentMaxPrice, currentCategory, currentSeller, currentRating, updateParams, clearAllFilters, hasActiveFilters };

  return (
    <>
      <div className="mb-4 flex items-center gap-3 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setMobileOpen(true)} className="gap-2"><SlidersHorizontal size={16} />Filters</Button>
        <select value={currentSort} onChange={(e) => updateParams('sort', e.target.value)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Sort products">
          {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {hasActiveFilters && <button type="button" onClick={clearAllFilters} className="text-sm text-red-600 hover:text-red-700">Clear</button>}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-full overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4"><h2 className="text-lg font-semibold">Filters</h2><button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-1 hover:bg-gray-100" aria-label="Close filters"><X size={20} /></button></div>
            <div className="p-4"><FiltersContent {...filterProps} /></div>
          </div>
        </div>
      )}

      <div className="hidden lg:block"><FiltersContent {...filterProps} /></div>
    </>
  );
}
