'use server';

/**
 * Cart server actions.
 * Handles database cart operations for authenticated users.
 *
 * SECURITY: All mutation operations verify ownership through the authenticated user.
 * A malicious user cannot modify another user's cart items.
 *
 * Note: Complex Supabase join queries use `as any` type assertions because
 * the query builder cannot fully infer types for deep joins. These types
 * should be verified against the actual database schema.
 */

import { createClient } from '@/lib/supabase/server';
import type { TablesInsert, TablesUpdate } from '@/types/database';

export type CartActionResult = {
  success: boolean;
  error?: string;
  itemCount?: number;
};

/**
 * A fully validated cart item from the database with product data attached.
 */
export type DatabaseCartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  price: number;
  quantity: number;
  imageUrl: string;
  sellerName: string;
  sellerId: string;
  maxQuantity: number;
  isValid: boolean;
  validationError?: string;
};

/**
 * Helper: verify that a cart item belongs to the authenticated user's cart.
 * Returns the user's cart ID if valid, or null if not.
 */
async function verifyCartItemOwnership(cartItemId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!cart) return null;

  // Verify the cart item belongs to this user's cart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: item } = await (supabase as any)
    .from('cart_items')
    .select('id')
    .eq('id', cartItemId)
    .eq('cart_id', cart.id)
    .single();

  return item ? cart.id : null;
}

/**
 * Get the authenticated user's full cart with validated product data.
 */
export async function getUserCartWithItems(): Promise<DatabaseCartItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!cart) return [];

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

  if (!cartItems || cartItems.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return cartItems.map((item: any) => {
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
    let price = product.base_price;
    let variantName: string | null = null;
    const maxQuantity = 99;

    if (!product.is_active || product.status !== 'active') {
      isValid = false;
      validationError = 'Product no longer available';
    }

    if (isValid && (!seller || seller.status !== 'active')) {
      isValid = false;
      validationError = 'Seller is no longer active';
    }

    if (isValid && item.variant_id) {
      const variant = variants.find((v: { id: string }) => v.id === item.variant_id);
      if (!variant) {
        isValid = false;
        validationError = 'Variant no longer exists';
      } else if (!variant.is_active) {
        isValid = false;
        validationError = `Variant "${variant.name}" is no longer available`;
      } else {
        price = variant.price;
        variantName = variant.name;
      }
    }

    if (isValid && (!item.quantity || item.quantity < 1)) {
      isValid = false;
      validationError = 'Invalid quantity';
    }

    const primaryImage = images?.find((img: { is_primary: boolean }) => img.is_primary) || images?.[0];

    return {
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      name: product.name,
      variantName,
      price,
      quantity: item.quantity,
      imageUrl: primaryImage?.url || '',
      sellerName: seller?.shop_name || '',
      sellerId: seller?.id || '',
      maxQuantity,
      isValid,
      validationError,
    };
  });
}

/**
 * Get just the cart item count for the current user.
 */
export async function getCartItemCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!cart) return 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from('cart_items')
    .select('quantity')
    .eq('cart_id', cart.id);

  if (!items) return 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return items.reduce((sum: number, item: any) => sum + item.quantity, 0);
}

/**
 * Sync guest cart items to the database cart.
 * Validates products, merges quantities, removes invalid items.
 */
export async function syncCartToDatabase(
  localItems: Array<{ productId: string; variantId: string | null; quantity: number }>
): Promise<CartActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  let { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!cart) {
    const { data: newCart } = await supabase
      .from('carts')
      .insert({ user_id: user.id } satisfies TablesInsert<'carts'>)
      .select('id')
      .single();
    cart = newCart;
  }

  if (!cart) return { success: false, error: 'Failed to create cart' };

  for (const li of localItems) {
    // Validate product exists and is active
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: product } = await (supabase as any)
      .from('products')
      .select('id, status, is_active, base_price, seller_id, sellers!inner(status)')
      .eq('id', li.productId)
      .single();

    if (!product || !product.is_active || product.status !== 'active') continue;
    if (!product.sellers || product.sellers.status !== 'active') continue;

    if (li.variantId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: variant } = await (supabase as any)
        .from('product_variants')
        .select('id, price, is_active')
        .eq('id', li.variantId)
        .eq('product_id', li.productId)
        .single();

      if (!variant || !variant.is_active) continue;
    }

    // Check if item already exists in DB cart
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingItem } = await (supabase as any)
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('product_id', li.productId)
      .eq('variant_id', li.variantId)
      .single();

    if (existingItem) {
      const newQty = Math.max(existingItem.quantity, li.quantity);
      await supabase
        .from('cart_items')
        .update({ quantity: newQty, updated_at: new Date().toISOString() } as TablesUpdate<'cart_items'>)
        .eq('id', existingItem.id);
    } else {
      await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: li.productId,
          variant_id: li.variantId,
          quantity: li.quantity,
        } as TablesInsert<'cart_items'>);
    }
  }

  return { success: true };
}

/**
 * Add an item to the database cart.
 */
export async function addToDatabaseCart(
  productId: string,
  variantId: string | null,
  quantity: number
): Promise<CartActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  let { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!cart) {
    const { data: newCart } = await supabase
      .from('carts')
      .insert({ user_id: user.id } satisfies TablesInsert<'carts'>)
      .select('id')
      .single();
    cart = newCart;
  }

  if (!cart) return { success: false, error: 'Failed to create cart' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .eq('variant_id', variantId)
    .single();

  if (existing) {
    await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() } as TablesUpdate<'cart_items'>)
      .eq('id', existing.id);
  } else {
    await supabase
      .from('cart_items')
      .insert({
        cart_id: cart.id,
        product_id: productId,
        variant_id: variantId,
        quantity,
      } as TablesInsert<'cart_items'>);
  }

  return { success: true };
}

/**
 * Update a cart item quantity in the database.
 * SECURITY: Verifies the cart item belongs to the authenticated user's cart.
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
): Promise<CartActionResult> {
  // Verify ownership before modifying
  const cartId = await verifyCartItemOwnership(cartItemId);
  if (!cartId) {
    return { success: false, error: 'Cart item not found or access denied' };
  }

  const supabase = await createClient();

  if (quantity <= 0) {
    await supabase.from('cart_items').delete().eq('id', cartItemId).eq('cart_id', cartId);
  } else {
    await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() } as TablesUpdate<'cart_items'>)
      .eq('id', cartItemId)
      .eq('cart_id', cartId);
  }

  return { success: true };
}

/**
 * Remove an item from the database cart.
 * SECURITY: Verifies the cart item belongs to the authenticated user's cart.
 */
export async function removeFromDatabaseCart(cartItemId: string): Promise<CartActionResult> {
  // Verify ownership before modifying
  const cartId = await verifyCartItemOwnership(cartItemId);
  if (!cartId) {
    return { success: false, error: 'Cart item not found or access denied' };
  }

  const supabase = await createClient();
  await supabase.from('cart_items').delete().eq('id', cartItemId).eq('cart_id', cartId);
  return { success: true };
}

/**
 * Clear all items from the database cart.
 */
export async function clearDatabaseCart(): Promise<CartActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (cart) {
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
  }

  return { success: true };
}
