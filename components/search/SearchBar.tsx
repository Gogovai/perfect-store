'use client';

import React, { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

export function SearchBar({
  placeholder = 'Search products...',
  className = '',
  defaultValue = '',
}: SearchBarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || defaultValue);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set('q', query.trim());
      } else {
        params.delete('q');
      }
      params.delete('page');
      router.push(`/search?${params.toString()}`);
    },
    [query, searchParams, router]
  );

  const clearSearch = () => {
    setQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('page');
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border border-transparent rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          aria-label="Search products"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </form>
  );
}
