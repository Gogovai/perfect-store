'use client';
import Link from 'next/link';
import Image from 'next/image';
import { getCategoryImage } from '@/lib/data/campaigns';
import type { Category } from '@/lib/queries/categories';

interface CategoryCardProps { category: Category; productCount?: number; size?: 'sm' | 'md' | 'lg'; }
export function CategoryCard({ category, productCount, size = 'md' }: CategoryCardProps) {
  const imageUrl = category.image_url || getCategoryImage(category.slug, null);
  const sizeClasses = { sm: 'h-36', md: 'h-44', lg: 'h-52' };
  return <Link href={`/categories/${category.slug}`} className="group"><div className={`relative ${sizeClasses[size]} rounded-xl overflow-hidden bg-gray-100`}>
    <Image src={imageUrl} alt={category.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4"><h3 className="text-sm sm:text-base font-bold text-white leading-tight">{category.name}</h3>{category.description && <p className="text-[10px] sm:text-xs text-white/70 mt-0.5 line-clamp-1">{category.description}</p>}{productCount !== undefined && <p className="text-[10px] text-white/60 mt-1">{productCount} products</p>}</div>
  </div></Link>;
}
