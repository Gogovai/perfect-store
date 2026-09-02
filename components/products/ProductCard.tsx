'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Truck, Heart } from 'lucide-react';
import { ProductPrice } from './ProductPrice';
import { ProductRating } from './ProductRating';
import { ProductBadge } from './ProductBadge';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import type { ProductWithRelations } from '@/lib/queries/products';

interface ProductCardProps {
  product: ProductWithRelations;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const variantPrices = product.product_variants
    .filter((v) => v.is_active)
    .map((v) => v.price)
    .filter((p): p is number => p !== null);
  const lowestVariantPrice = variantPrices.length
    ? Math.min(product.base_price, ...variantPrices)
    : product.base_price;
  const hasDiscount = lowestVariantPrice < product.base_price;
  const discountPercent = hasDiscount
    ? Math.round(((product.base_price - lowestVariantPrice) / product.base_price) * 100)
    : 0;
  const seller = product.sellers;
  const primaryImage =
    product.product_images.find((img) => img.is_primary) ||
    product.product_images[0];

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-[#0f2b5b]/20 hover:shadow-xl hover:-translate-y-0.5">
      {/* Image area */}
      <div className="relative">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-square overflow-hidden bg-gray-50"
        >
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text || product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300">
              <Package size={42} strokeWidth={1.4} />
              <span className="mt-2 text-[11px] font-medium text-gray-400">
                Image coming soon
              </span>
            </div>
          )}
        </Link>

        {/* Badges top-left */}
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          <ProductBadge
            compareAtPrice={hasDiscount ? product.base_price : null}
            price={lowestVariantPrice}
            soldCount={product.review_count}
          />
        </div>

        {/* Wishlist top-right */}
        <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <WishlistButton
            productId={product.id}
            productName={product.name}
            price={product.base_price}
            imageUrl={primaryImage?.url || ''}
            slug={product.slug}
            sellerName={seller?.store_name || ''}
            size="sm"
          />
        </div>

        {/* Free shipping ribbon */}
        {product.base_price >= 200 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1.5 flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Truck size={12} className="text-white" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-white">
              Free Shipping
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-1 flex-col p-3 sm:p-4"
      >
        {seller && (
          <p className="mb-1 truncate text-[11px] font-medium text-[#0f2b5b]/60">
            {seller.store_name}
          </p>
        )}
        <h3 className="mb-1.5 line-clamp-2 text-[13px] font-medium leading-snug text-gray-800 transition-colors group-hover:text-[#0f2b5b] sm:text-sm">
          {product.name}
        </h3>
        <div className="mb-2">
          <ProductRating
            rating={product.rating_average}
            reviewCount={product.review_count}
            size="sm"
          />
        </div>
        <div className="mt-auto">
          <ProductPrice
            price={product.base_price}
            variantPrice={hasDiscount ? lowestVariantPrice : null}
            size="md"
          />
        </div>
      </Link>
    </div>
  );
}
