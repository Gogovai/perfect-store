import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getRelatedProducts } from '@/lib/queries/products';
import { ProductDetailClient } from '@/components/products/ProductDetailClient';
import { brand } from '@/config/brand';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const primaryImage = product.product_images.find((img) => img.is_primary) || product.product_images[0];

  return {
    title: `${product.name} - ${brand.name}`,
    description: product.description?.slice(0, 160) || `Buy ${product.name} on ${brand.name}`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) || `Buy ${product.name}`,
      type: 'website',
      images: primaryImage ? [{ url: primaryImage.url, width: 800, height: 800, alt: product.name }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product.category_id, product.id, 4);

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
