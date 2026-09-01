import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProductBySlug, getRelatedProducts } from '@/lib/queries/products';
import { ProductDetailClient } from '@/components/products/ProductDetailClient';

interface ProductPageProps { params: Promise<{ slug: string }>; }

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found | Perfect Store' };
  return { title: `${product.name} | Perfect Store`, description: product.short_description || product.description || `Shop ${product.name} on Perfect Store.` };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const relatedProducts = product.category_id ? await getRelatedProducts(product.category_id, product.id, 4) : [];
  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
