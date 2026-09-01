import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database';

export type Category = Tables<'categories'>;

export type CategoryWithSubcategories = Category & {
  subcategories?: Category[];
};

/**
 * Fetch all active top-level categories with their subcategories.
 */
export async function getCategories(): Promise<CategoryWithSubcategories[]> {
  const supabase = await createClient();

  const { data: parentCategories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null)
    .order('name');

  if (error || !parentCategories) {
    return [];
  }

  // Fetch all active subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .not('parent_id', 'is', null)
    .order('name');

  const subMap = new Map<string, Category[]>();
  if (subcategories) {
    for (const sub of subcategories as Category[]) {
      if (sub.parent_id) {
        const existing = subMap.get(sub.parent_id) || [];
        existing.push(sub);
        subMap.set(sub.parent_id, existing);
      }
    }
  }

  return (parentCategories as Category[]).map((cat) => ({
    ...cat,
    subcategories: subMap.get(cat.id) || [],
  }));
}

/**
 * Fetch a single category by slug, including its subcategories.
 */
export async function getCategoryBySlug(slug: string): Promise<CategoryWithSubcategories | null> {
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !category) {
    return null;
  }

  // Fetch subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', (category as Category).id)
    .eq('is_active', true)
    .order('name');

  return {
    ...(category as Category),
    subcategories: (subcategories as Category[]) || [],
  };
}

/**
 * Fetch the parent category for a given category.
 */
export async function getCategoryParent(categoryId: string): Promise<Category | null> {
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  const catData = category as unknown as Category;
  if (!catData?.parent_id) {
    return null;
  }

  const { data: parent } = await supabase
    .from('categories')
    .select('*')
    .eq('id', catData.parent_id)
    .single();

  if (!parent) return null;
  return parent as unknown as Category;
}

/**
 * Fetch breadcrumb chain for a category (parent → current).
 */
export async function getCategoryBreadcrumbs(slug: string): Promise<Category[]> {
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!category) return [];

  const cat = category as Category;
  const breadcrumbs: Category[] = [cat];

  if (cat.parent_id) {
    const { data: parent } = await supabase
      .from('categories')
      .select('*')
      .eq('id', cat.parent_id)
      .single();

    if (parent) {
      breadcrumbs.unshift(parent as Category);
    }
  }

  return breadcrumbs;
}
