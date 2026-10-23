'use server';

/**
 * Checkout server actions.
 * Validates cart from database, calculates authoritative prices,
 * and prepares order data. Payment initialization is handled by the Hubtel API route.
 *
 * SECURITY: Never trust client-submitted prices, quantities, or totals.
 * All calculations are performed server-side against the database.
 */

import { createClient } from '@/lib/supabase/server';
import type { DeliveryOption } from '@/lib/config/delivery';
import { isClothingCategory } from '@/lib/utils/clothing';

/**
 * A validated, server-authoritative cart item for checkout.
 */
export type ValidatedCartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  isValid: boolean;
  validationError?: string;
};

/**
 * Checkout summary calculated server-side.
 */
export async function getHubtelPaymentAvailability(): Promise<boolean> {
  return Boolean(process.env.HUBTEL_CLIENT_ID && process.env.HUBTEL_CLIENT_SECRET && process.env.HUBTEL_MERCHANT_ACCOUNT_ID);
}

export type CheckoutSummary = {
  items: ValidatedCartItem[];
  validItems: ValidatedCartItem[];
  invalidItems: ValidatedCartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  itemCount: number;
  hasChanges: boolean;
  warnings: string[];
  deliveryOptions: DeliveryOption[];
};

/**
 * Validate the current user's cart for checkout.
 * Fetches cart from database, validates every item against authoritative data.
 * Returns server-calculated totals — never trust client totals.
 */
export async function validateCheckout(
  deliveryMethodId: string = '',
  addressId?: string | null
): Promise<CheckoutSummary> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      items: [],
      validItems: [],
      invalidItems: [],
      subtotal: 0,
      shippingCost: 0,
      total: 0,
      itemCount: 0,
      hasChanges: false,
      warnings: ['Please log in to continue checkout.'],
      deliveryOptions: [],
    };
  }

  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!cart) {
    return {
      items: [],
      validItems: [],
      invalidItems: [],
      subtotal: 0,
      shippingCost: 0,
      total: 0,
      itemCount: 0,
      hasChanges: false,
      warnings: ['Your cart is empty.'],
      deliveryOptions: [],
    };
  }

  let deliveryOptions: DeliveryOption[] = [];
  let usingFallbackDeliveryRates = false;
  if (addressId) {
    const { data: address } = await supabase
      .from('addresses')
      .select('id,city,region')
      .eq('id', addressId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (address) {
      // Shipping rates are configured by the store owner in Admin > Logistics.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rates } = await (supabase as any)
        .from('shipping_rates')
        .select('id,method,price,eta_min_days,eta_max_days,delivery_zones!inner(id,name,city,region,is_active)')
        .eq('is_active', true)
        .eq('delivery_zones.is_active', true)
        .order('price', { ascending: true });

      type DeliveryZoneRecord = { id: string; name: string; city: string | null; region: string | null; is_active: boolean };
      type ShippingRateRecord = { method: string; price: number; eta_min_days: number | null; eta_max_days: number | null; delivery_zones: DeliveryZoneRecord | DeliveryZoneRecord[] | null };
      const rateRows = (rates ?? []) as unknown as ShippingRateRecord[];
      const normalize = (value: unknown) => String(value ?? '').trim().toLocaleLowerCase();
      const matchingRates = rateRows.map((rate) => {
        const zone = Array.isArray(rate.delivery_zones) ? rate.delivery_zones[0] : rate.delivery_zones;
        const zoneCity = normalize(zone?.city);
        const addressCity = normalize(address.city);
        const zoneRegion = normalize(zone?.region);
        const addressRegion = normalize(address.region);
        const cityMatch = Boolean(zoneCity && addressCity && zoneCity === addressCity);
        const regionMatch = Boolean(!zoneCity && zoneRegion && zoneRegion === addressRegion);
        const nationwideMatch = !zoneCity && !zoneRegion;
        const matches = zoneCity ? cityMatch : regionMatch || nationwideMatch;
        const matchRank = cityMatch ? 0 : regionMatch ? 1 : nationwideMatch ? 2 : 3;
        return { rate, zone, matches, cityMatch, matchRank, nationwideMatch };
      }).filter((item) => item.matches && item.zone)
        .sort((a, b) => a.matchRank - b.matchRank || Number(a.rate.price) - Number(b.rate.price));

      const seenMethods = new Set<string>();
      deliveryOptions = matchingRates.flatMap((item) => {
        const method = String(item.rate.method ?? '').trim().toLowerCase();
        if (!method || seenMethods.has(method) || !item.zone) return [];
        seenMethods.add(method);
        const min = item.rate.eta_min_days == null ? null : Number(item.rate.eta_min_days);
        const max = item.rate.eta_max_days == null ? null : Number(item.rate.eta_max_days);
        const eta = min !== null && max !== null
          ? `Estimated delivery: ${min}–${max} business days`
          : 'Delivery time confirmed by the store';
        return [{
          id: method,
          name: method.split(/[_ -]+/).map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
          description: `${eta} · ${item.zone.name}${item.nationwideMatch ? ' · Ghana-wide' : ''}`,
          price: Number(item.rate.price),
          etaMinDays: min,
          etaMaxDays: max,
          zoneName: String(item.zone.name ?? ''),
        }];
      });

      // Until the owner configures delivery zones/rates, preserve the existing
      // checkout fees rather than blocking all Ghana orders. Once any rates
      // exist, an unmatched address stays blocked instead of using a fallback.
      if (deliveryOptions.length === 0 && rateRows.length === 0) {
        usingFallbackDeliveryRates = true;
        deliveryOptions = [
          {
            id: 'standard',
            name: 'Standard',
            description: 'Nationwide delivery · temporary default rate',
            price: 15,
            etaMinDays: null,
            etaMaxDays: null,
            zoneName: 'Ghana-wide temporary default',
          },
          {
            id: 'express',
            name: 'Express',
            description: 'Nationwide delivery · temporary default rate',
            price: 35,
            etaMinDays: null,
            etaMaxDays: null,
            zoneName: 'Ghana-wide temporary default',
          },
        ];
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cartItems } = await (supabase as any)
    .from('cart_items')
    .select(`
      id,
      quantity,
      product_id,
      variant_id,
      products!inner(
        id,
        name,
        slug,
        base_price,
        status,
        categories!inner(name, slug),
        product_images(url, is_primary),
        product_variants(id, name, price, is_active)
      )
    `)
    .eq('cart_id', cart.id);

  if (!cartItems || cartItems.length === 0) {
    return {
      items: [],
      validItems: [],
      invalidItems: [],
      subtotal: 0,
      shippingCost: 0,
      total: 0,
      itemCount: 0,
      hasChanges: false,
      warnings: ['Your cart is empty.'],
      deliveryOptions: [],
    };
  }

  const validatedItems: ValidatedCartItem[] = [];
  const warnings: string[] = [];
  if (usingFallbackDeliveryRates) warnings.push('Temporary default delivery fees are being used until the store owner configures delivery zones and rates.');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const item of cartItems as any[]) {
    const product = item.products;
    const images = (product?.product_images ?? []) as Array<{ url: string; is_primary: boolean }>;
    const variants = (product?.product_variants ?? []) as Array<{
      id: string;
      name: string;
      price: number;
      is_active: boolean;
    }>;

    let isValid = true;
    let validationError = '';
    let unitPrice = Number(product?.base_price ?? 0);
    let variantName: string | null = null;
    let imageUrl = '';

    const primaryImage = images?.find((img: { is_primary: boolean }) => img.is_primary) || images?.[0];
    if (primaryImage) {
      imageUrl = primaryImage.url;
    }

    // Validate product
    if (!product) {
      isValid = false;
      validationError = 'Product no longer exists';
    } else if (product.status !== 'active') {
      isValid = false;
      validationError = 'This product is no longer available';
    } else if (!isClothingCategory(product.categories?.name, product.categories?.slug)) {
      isValid = false;
      validationError = 'This store only sells clothing, footwear, and fashion accessories';
    }


    // Validate variant if applicable
    if (isValid && item.variant_id) {
      const variant = variants.find((v: { id: string }) => v.id === item.variant_id);
      if (!variant) {
        isValid = false;
        validationError = 'Selected variant no longer exists';
      } else if (!variant.is_active) {
        isValid = false;
        validationError = `Variant "${variant.name}" is no longer available`;
      } else {
        unitPrice = variant.price;
        variantName = variant.name;
      }
    }

    // Validate quantity
    if (isValid && (!item.quantity || item.quantity < 1)) {
      isValid = false;
      validationError = 'Invalid quantity';
    }

    // Check inventory if available
    if (isValid) {
      if (item.variant_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: varInv } = await (supabase as any)
          .from('variant_inventory')
          .select('quantity, reserved_quantity')
          .eq('variant_id', item.variant_id)
          .single();

        if (varInv && (varInv.quantity - varInv.reserved_quantity) < item.quantity) {
          isValid = false;
          validationError = 'Insufficient stock for requested quantity';
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: prodInv } = await (supabase as any)
          .from('inventory')
          .select('quantity, reserved_quantity')
          .eq('product_id', item.product_id)
          .single();

        if (prodInv && (prodInv.quantity - prodInv.reserved_quantity) < item.quantity) {
          isValid = false;
          validationError = 'Insufficient stock for requested quantity';
        }
      }
    }

    const validatedItem: ValidatedCartItem = {
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      productName: isValid ? product.name : product.name,
      variantName,
      imageUrl,
      unitPrice,
      quantity: item.quantity,
      lineTotal: isValid ? unitPrice * item.quantity : 0,
      isValid,
      validationError,
    };

    validatedItems.push(validatedItem);

    if (!isValid) {
      warnings.push(`${product.name}: ${validationError}`);
    }
  }

  const validItems = validatedItems.filter((i) => i.isValid);
  const invalidItems = validatedItems.filter((i) => !i.isValid);

  const subtotal = Math.round(validItems.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100;
  // Keep the displayed checkout total aligned with the database order RPC's
  // GHS 200 free-delivery threshold.
  const displayedDeliveryOptions = subtotal >= 200
    ? deliveryOptions.map((option) => ({ ...option, price: 0, description: `${option.description} · Free delivery on orders of GHS 200+` }))
    : deliveryOptions;
  const selectedDeliveryOption = displayedDeliveryOptions.find((option) => option.id === deliveryMethodId);
  const shippingCost = selectedDeliveryOption?.price ?? 0;
  if (addressId && deliveryOptions.length === 0) warnings.push('No delivery rate is configured for this address. Please contact the store before placing your order.');
  if (addressId && deliveryOptions.length > 0 && !selectedDeliveryOption) warnings.push('Select an available delivery method to see the final total.');
  const total = Math.round((subtotal + shippingCost) * 100) / 100;
  const hasChanges = invalidItems.length > 0;

  return {
    items: validatedItems,
    validItems,
    invalidItems,
    subtotal,
    shippingCost,
    total,
    itemCount: validItems.reduce((sum, i) => sum + i.quantity, 0),
    hasChanges,
    warnings,
    deliveryOptions: displayedDeliveryOptions,
  };
}

/**
 * Prepare an order for creation.
 * This does NOT create the order yet — it prepares the data structure
 * that will be used when payment is implemented.
 */
export async function prepareOrder(
  addressId: string,
  deliveryMethodId: string,
  notes?: string
): Promise<{
  success: boolean;
  error?: string;
  orderData?: {
    userId: string;
    addressId: string;
    items: ValidatedCartItem[];
    subtotal: number;
    shippingCost: number;
    total: number;
    deliveryMethodId: string;
    notes?: string;
  };
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: address } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .single();

  if (!address) {
    return { success: false, error: 'Invalid delivery address' };
  }

  const checkout = await validateCheckout(deliveryMethodId);

  if (checkout.invalidItems.length > 0) {
    return {
      success: false,
      error: 'Some items in your cart are no longer available. Please review your cart.',
    };
  }

  if (checkout.validItems.length === 0) {
    return { success: false, error: 'Your cart is empty' };
  }

  const orderData = {
    userId: user.id,
    addressId,
    items: checkout.validItems,
    subtotal: checkout.subtotal,
    shippingCost: checkout.shippingCost,
    total: checkout.total,
    deliveryMethodId,
    notes,
  };

  return { success: true, orderData };
}
