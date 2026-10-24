'use server';

import { createClient } from '@/lib/supabase/server';
import { isClothingCategory } from '@/lib/utils/clothing';

export type StoreLaunchReadiness = {
  activeClothingProducts: number;
  activeDeliveryZones: number;
  activeShippingRates: number;
  nationwideStandardConfigured: boolean;
  nationwideExpressConfigured: boolean;
  hubtelConfigured: boolean;
};

export async function getStoreLaunchReadiness(): Promise<StoreLaunchReadiness | null> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || profile?.role !== 'admin') return null;

  const { data: categories, error: categoryError } = await supabase
    .from('categories')
    .select('id,name,slug')
    .eq('is_active', true);
  if (categoryError) throw new Error('Unable to check catalogue readiness.');

  const clothingIds = (categories ?? [])
    .filter((category) => isClothingCategory(category.name, category.slug))
    .map((category) => category.id);

  let activeClothingProducts = 0;
  if (clothingIds.length > 0) {
    // The admin view can see legacy products, but readiness counts only products
    // that are eligible for the public single-store catalogue.
    const { count, error } = await (supabase as any)
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .in('owner_type', ['admin', 'platform'])
      .in('category_id', clothingIds);
    if (error) throw new Error('Unable to check active clothing products.');
    activeClothingProducts = count ?? 0;
  }

  const [{ data: zones, error: zonesError }, { data: rates, error: ratesError }] = await Promise.all([
    (supabase as any).from('delivery_zones').select('id,city,region,is_active').eq('is_active', true),
    (supabase as any).from('shipping_rates').select('id,zone_id,method,is_active').eq('is_active', true),
  ]);
  if (zonesError || ratesError) throw new Error('Unable to check delivery configuration.');

  const nationwideZoneIds = new Set<string>(
    ((zones ?? []) as Array<{ id: string; city: string | null; region: string | null }>)
      .filter((zone) => !String(zone.city ?? '').trim() && !String(zone.region ?? '').trim())
      .map((zone) => zone.id),
  );
  const nationwideMethods = new Set<string>(
    ((rates ?? []) as Array<{ zone_id: string; method: string }>)
      .filter((rate) => nationwideZoneIds.has(rate.zone_id))
      .map((rate) => String(rate.method ?? '').trim().toLowerCase()),
  );

  return {
    activeClothingProducts,
    activeDeliveryZones: (zones ?? []).length,
    activeShippingRates: (rates ?? []).length,
    nationwideStandardConfigured: nationwideMethods.has('standard'),
    nationwideExpressConfigured: nationwideMethods.has('express'),
    hubtelConfigured: Boolean(
      process.env.HUBTEL_CLIENT_ID &&
      process.env.HUBTEL_CLIENT_SECRET &&
      process.env.HUBTEL_MERCHANT_ACCOUNT_ID,
    ),
  };
}
