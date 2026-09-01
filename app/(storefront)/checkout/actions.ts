'use server';

/**
 * Checkout server actions.
 * Validates cart from database, calculates authoritative prices,
 * and prepares order data. No payment processing yet.
 *
 * SECURITY: Never trust client-submitted prices, quantities, or totals.
 * All calculations are performed server-side against the database.
 */

import { createClient } from '@/lib/supabase/server';
import { getDeliveryPrice, FREE_DELIVERY_THRESHOLD } from '@/lib/config/delivery';

/**
 * A validated, server-authoritative cart item for checkout.
 */
export type ValidatedCartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sellerId: string;
  sellerName: string;
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
};

/**
 * Validate the current user's cart for checkout.
 * Fetches cart from database, validates every item against authoritative data.
 * Returns server-calculated totals — never trust client totals.
 */
export async function validateCheckout(
  deliveryMethodId: string = 'standard'
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
    };
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
        is_active,
        seller_id,
        sellers!inner(id, shop_name, status),
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
    };
  }

  const validatedItems: ValidatedCartItem[] = [];
  const warnings: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const item of cartItems as any[]) {
    const product = item.products;
    const seller = product.sellers;
    const images = product.product_images as Array<{ url: string; is_primary: boolean }>;
    const variants = product.product_variants as Array<{
      id: string;
      name: string;
      price: number;
      is_active: boolean;
    }>;

    let isValid = true;
    let validationError = '';
    let unitPrice = product.base_price;
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
    } else if (!product.is_active || product.status !== 'active') {
      isValid = false;
      validationError = 'This product is no longer available';
    }

    // Validate seller
    if (isValid && (!seller || seller.status !== 'active')) {
      isValid = false;
      validationError = 'This seller is no longer active';
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
          .select('quantity, reserved')
          .eq('variant_id', item.variant_id)
          .single();

        if (varInv && (varInv.quantity - varInv.reserved) < item.quantity) {
          isValid = false;
          validationError = 'Insufficient stock for requested quantity';
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: prodInv } = await (supabase as any)
          .from('inventory')
          .select('quantity, reserved')
          .eq('product_id', item.product_id)
          .single();

        if (prodInv && (prodInv.quantity - prodInv.reserved) < item.quantity) {
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
      sellerId: seller?.id || '',
      sellerName: seller?.shop_name || '',
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
  const deliveryPrice = getDeliveryPrice(deliveryMethodId);
  const shippingCost = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : deliveryPrice;
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
