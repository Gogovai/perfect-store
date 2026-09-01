'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ProductPrice } from './ProductPrice';
import { ProductRating } from './ProductRating';
import { ProductBadge } from './ProductBadge';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import type { ProductWithRelations } from '@/lib/queries/products';

interface ProductCardProps { product: ProductWithRelations; priority?: boolean; }

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const variantPrices = product.product_variants.filter((v) => v.is_active).map((v) => v.price).filter((p): p is number => p !== null);
  const lowestVariantPrice = variantPrices.length ? Math.min(product.base_price, ...variantPrices) : product.base_price;
  const hasDiscount = lowestVariantPrice < product.base_price;
  const seller = product.sellers;
  const primaryImage = product.product_images.find((img) => img.is_primary) || product.product_images[0];
  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden h-full flex flex-col hover:shadow-lg hover:border-gray-200 transition-all duration-200">
      <div className="relative">
        <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-gray-50">
          {primaryImage ? <Image src={primaryImage.url} alt={primaryImage.alt_text || product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={priority} /> : <div className="flex items-center justify-center h-full text-gray-300 text-sm">No image</div>}
        </Link>
        <div className="absolute top-2 left-2 flex flex-col gap-1"><ProductBadge compareAtPrice={hasDiscount ? product.base_price : null} price={lowestVariantPrice} soldCount={0} /></div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><WishlistButton productId={product.id} productName={product.name} price={product.base_price} imageUrl={primaryImage?.url || ''} slug={product.slug} sellerName={seller?.store_name || ''} size="sm" /></div>
      </div>
      <Link href={`/products/${product.slug}`} className="flex flex-col flex-1 p-3 sm:p-4">
        {seller && <p className="text-[11px] text-gray-400 mb-1 truncate">{seller.store_name}</p>}
        <h3 className="text-[13px] sm:text-sm font-medium text-gray-800 line-clamp-2 mb-1.5 leading-snug group-hover:text-[#0f2b5b] transition-colors">{product.name}</h3>
        <div className="mb-2"><ProductRating rating={product.rating_average} reviewCount={product.review_count} size="sm" /></div>
        <div className="mt-auto"><ProductPrice price={product.base_price} variantPrice={hasDiscount ? lowestVariantPrice : null} size="md" /></div>
      </Link>
    </div>
  );
}
