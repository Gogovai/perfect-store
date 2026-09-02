import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { SearchX, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-gray-50 flex items-center justify-center px-4">
      <Container size="md">
        <div className="text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-6">
            <SearchX size={40} className="text-gray-400" />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Page not found</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. 
            Try searching for products or browse our categories.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <Button variant="outline" size="lg">
                <Home size={16} /> Back to Home
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
