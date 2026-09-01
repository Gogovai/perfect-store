'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ProductGallery } from '@/components/products/ProductGallery';
import { ProductPrice } from '@/components/products/ProductPrice';
import { ProductRating } from '@/components/products/ProductRating';
import { ProductGrid } from '@/components/products/ProductGrid';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { useCartStore } from '@/stores/cart';
import { formatPrice } from '@/lib/utils/formatting';
import { Truck, Shield, RotateCcw, ShoppingCart, ChevronRight, Check } from 'lucide-react';
import type { ProductWithRelations } from '@/lib/queries/products';

interface ProductDetailClientProps { product: ProductWithRelations; relatedProducts: ProductWithRelations[]; }

export function ProductDetailClient({ product, relatedProducts }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const activeVariants = product.product_variants.filter((v) => v.is_active && v.price !== null);
  const hasVariants = activeVariants.length > 0;
  const seller = product.sellers;
  const category = product.categories;
  const selectedVariantData = selectedVariant ? activeVariants.find((v) => v.id === selectedVariant) : null;
  const currentPrice = selectedVariantData?.price ?? product.base_price;

  function handleAddToCart() {
    const primaryImage = product.product_images.find((img) => img.is_primary) || product.product_images[0];
    addItem({ productId: product.id, variantId: selectedVariant, name: product.name, variantName: selectedVariantData?.name || null, price: currentPrice, imageUrl: primaryImage?.url || '', sellerName: seller?.store_name || '', sellerId: seller?.id || '', maxQuantity: 99, quantity });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  return (
    <div className="py-4 sm:py-6 bg-gray-50 min-h-[calc(100vh-8rem)]"><Container size="xl">
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4 overflow-x-auto" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-gray-900 shrink-0">Home</Link><ChevronRight size={14} className="text-gray-300 shrink-0" />
        {category && <><Link href={`/categories/${category.slug}`} className="hover:text-gray-900 shrink-0">{category.name}</Link><ChevronRight size={14} className="text-gray-300 shrink-0" /></>}
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6"><div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <ProductGallery images={product.product_images.slice().sort((a, b) => a.sort_order - b.sort_order)} productName={product.name} />
        <div className="space-y-5">
          <div className="flex items-start justify-between">
            {seller && <Link href={`/sellers/${seller.id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              {seller.logo_url && <Image src={seller.logo_url} alt={seller.store_name} width={20} height={20} className="rounded-full" unoptimized />}
              <span>{seller.store_name}</span>{seller.rating > 0 && <span className="text-xs text-gray-400">({seller.rating.toFixed(1)}★)</span>}
            </Link>}
            <WishlistButton productId={product.id} productName={product.name} price={product.base_price} imageUrl={product.product_images[0]?.url || ''} slug={product.slug} sellerName={seller?.store_name || ''} size="md" />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{product.name}</h1>
          <ProductRating rating={product.rating_average} reviewCount={product.review_count} size="md" />
          <div className="bg-gray-50 rounded-lg p-4"><ProductPrice price={product.base_price} variantPrice={selectedVariantData?.price ?? null} size="lg" /></div>
          {hasVariants && <div><h3 className="text-sm font-semibold text-gray-900 mb-2">Options</h3><div className="flex flex-wrap gap-2">
            {activeVariants.map((variant) => <button key={variant.id} onClick={() => setSelectedVariant(variant.id === selectedVariant ? null : variant.id)} className={`px-3 py-2 border rounded-lg text-sm transition-colors ${selectedVariant === variant.id ? 'border-[#0f2b5b] bg-blue-50 text-[#0f2b5b] font-medium' : 'border-gray-300 hover:border-gray-400'}`}><span className="font-medium">{variant.name}</span><span className="text-gray-500 ml-2">{formatPrice(variant.price!)}</span></button>)}
          </div></div>}
          <div className="flex flex-col sm:flex-row gap-3"><div className="flex items-center border border-gray-300 rounded-lg"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2.5 text-gray-600 hover:text-gray-900" aria-label="Decrease quantity">−</button><span className="px-4 py-2.5 text-sm font-medium min-w-[3rem] text-center">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2.5 text-gray-600 hover:text-gray-900" aria-label="Increase quantity">+</button></div>
            <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={product.status !== 'active' || addedToCart}>{addedToCart ? <><Check size={20} />Added to Cart</> : <><ShoppingCart size={20} />Add to Cart</>}</Button>
          </div>
          <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500" /><span className="text-sm font-medium text-green-700">Available</span></div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100"><div className="flex items-center gap-3 text-sm"><Truck size={18} className="text-gray-500 shrink-0" /><span className="text-gray-600">Free delivery on orders over ₵200</span></div><div className="flex items-center gap-3 text-sm"><Shield size={18} className="text-gray-500 shrink-0" /><span className="text-gray-600">Buyer protection guarantee</span></div><div className="flex items-center gap-3 text-sm"><RotateCcw size={18} className="text-gray-500 shrink-0" /><span className="text-gray-600">7-day return policy</span></div></div>
        </div>
      </div></div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6"><h2 className="text-lg font-semibold text-gray-900 mb-4">Product Description</h2><div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-line">{product.description || 'No description available.'}</div></div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6"><h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Reviews</h2><div className="text-center py-8"><p className="text-gray-500">Reviews will be available soon.</p></div></div>
      {relatedProducts.length > 0 && <div><h2 className="text-lg font-semibold text-gray-900 mb-4">Related Products</h2><ProductGrid products={relatedProducts} /></div>}
    </Container></div>
  );
}
