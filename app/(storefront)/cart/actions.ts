'use server';

import { createClient } from '@/lib/supabase/server';
import type { TablesInsert, TablesUpdate } from '@/types/database';

export type CartActionResult = { success: boolean; error?: string; itemCount?: number };

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

async function verifyCartItemOwnership(cartItemId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
  if (!cart) return null;
  const { data: item } = await supabase
    .from('cart_items')
    .select('id')
    .eq('id', cartItemId)
    .eq('cart_id', cart.id)
    .maybeSingle();
  return item ? cart.id : null;
}

export async function getUserCartWithItems(): Promise<DatabaseCartItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
  if (!cart) return [];

  const { data: cartItems } = await supabase
    .from('cart_items')
    .select(`id, quantity, product_id, variant_id, unit_price,
      products!inner(id, name, base_price, status, seller_id,
        sellers!inner(id, store_name, status),
        product_images(url, is_primary),
        product_variants(id, name, price, is_active))`)
    .eq('cart_id', cart.id);

  if (!cartItems) return [];

  return cartItems.map((item) => {
    const product = item.products as unknown as {
      id: string; name: string; base_price: number; status: string; seller_id: string;
      sellers: { id: string; store_name: string; status: string };
      product_images: Array<{ url: string; is_primary: boolean }>;
      product_variants: Array<{ id: string; name: string; price: number | null; is_active: boolean }>;
    };
    const seller = product?.sellers;
    const images = product?.product_images ?? [];
    const variants = product?.product_variants ?? [];
    let isValid = product?.status === 'active' && seller?.status === 'active';
    let validationError = isValid ? '' : (product?.status !== 'active' ? 'Product no longer available' : 'Seller is no longer active');
    let price = product?.base_price ?? item.unit_price;
    let variantName: string | null = null;

    if (isValid && item.variant_id) {
      const variant = variants.find((v) => v.id === item.variant_id);
      if (!variant) { isValid = false; validationError = 'Variant no longer exists'; }
      else if (!variant.is_active) { isValid = false; validationError = `Variant "${variant.name}" is no longer available`; }
      else { price = variant.price ?? price; variantName = variant.name; }
    }

    if (item.quantity < 1) { isValid = false; validationError = 'Invalid quantity'; }
    const primaryImage = images.find((img) => img.is_primary) ?? images[0];

    return {
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      name: product?.name ?? 'Product',
      variantName,
      price,
      quantity: item.quantity,
      imageUrl: primaryImage?.url ?? '',
      sellerName: seller?.store_name ?? '',
      sellerId: seller?.id ?? product?.seller_id ?? '',
      maxQuantity: 99,
      isValid,
      validationError: validationError || undefined,
    };
  });
}

export async function getCartItemCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
  if (!cart) return 0;
  const { data: items } = await supabase
    .from('cart_items')
    .select('quantity')
    .eq('cart_id', cart.id);
  return items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) ?? 0;
}

async function getOrCreateUserCart() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, cart: null };

  let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
  if (!cart) {
    const { data: newCart } = await supabase
      .from('carts')
      .insert({ user_id: user.id, currency: 'GHS' } as TablesInsert<'carts'>)
      .select('id').single();
    cart = newCart;
  }
  return { supabase, user, cart };
}

/**
 * Replace the user's database cart with the validated contents of the local
 * (zustand/localStorage) cart. The local cart is the source of truth while
 * browsing; this mirror makes the exact quantities/prices available to the
 * server-side checkout flow (create_order reads cart_items).
 *
 * Items that no longer exist, are inactive, or belong to inactive sellers are
 * skipped so they cannot be carried into an order.
 */
export async function syncCartToDatabase(
  localItems: Array<{ productId: string; variantId: string | null; quantity: number }>
): Promise<CartActionResult> {
  const { supabase, user, cart } = await getOrCreateUserCart();
  if (!user) return { success: false, error: 'Not authenticated' };
  if (!cart) return { success: false, error: 'Failed to create cart' };

  const validated: Array<{
    productId: string;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
  }> = [];

  for (const li of localItems) {
    if (li.quantity < 1 || li.quantity > 99) continue;
    const { data: product } = await supabase.from('products').select('id, status, base_price, seller_id').eq('id', li.productId).maybeSingle();
    if (!product || product.status !== 'active') continue;
    const { data: seller } = await supabase.from('sellers').select('status').eq('id', product.seller_id).maybeSingle();
    if (!seller || seller.status !== 'active') continue;

    let unitPrice = product.base_price;
    if (li.variantId) {
      const { data: variant } = await supabase.from('product_variants').select('id, price, is_active').eq('id', li.variantId).eq('product_id', li.productId).maybeSingle();
      if (!variant || !variant.is_active) continue;
      unitPrice = variant.price ?? unitPrice;
    }

    validated.push({ productId: li.productId, variantId: li.variantId, quantity: li.quantity, unitPrice });
  }

  await supabase.from('cart_items').delete().eq('cart_id', cart.id);
  if (validated.length > 0) {
    const { error } = await supabase.from('cart_items').insert(
      validated.map((v) => ({
        cart_id: cart.id,
        product_id: v.productId,
        variant_id: v.variantId,
        quantity: v.quantity,
        unit_price: v.unitPrice,
      } as TablesInsert<'cart_items'>))
    );
    if (error) return { success: false, error: 'Unable to save your cart. Please try again.' };
  }
  return { success: true };
}

export async function addToDatabaseCart(productId: string, variantId: string | null, quantity: number): Promise<CartActionResult> {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return { success: false, error: 'Invalid quantity' };
  const { supabase, user, cart } = await getOrCreateUserCart();
  if (!user) return { success: false, error: 'Not authenticated' };
  if (!cart) return { success: false, error: 'Failed to create cart' };

  const { data: product } = await supabase.from('products').select('id, status, base_price, seller_id').eq('id', productId).maybeSingle();
  if (!product || product.status !== 'active') return { success: false, error: 'Product is no longer available' };
  const { data: seller } = await supabase.from('sellers').select('status').eq('id', product.seller_id).maybeSingle();
  if (!seller || seller.status !== 'active') return { success: false, error: 'Seller is no longer active' };

  let unitPrice = product.base_price;
  if (variantId) {
    const { data: variant } = await supabase.from('product_variants').select('id, price, is_active').eq('id', variantId).eq('product_id', productId).maybeSingle();
    if (!variant || !variant.is_active) return { success: false, error: 'Product variant is no longer available' };
    unitPrice = variant.price ?? unitPrice;
  }

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .eq('variant_id', variantId ?? null)
    .maybeSingle();
  if (existing) {
    const nextQuantity = existing.quantity + quantity;
    if (nextQuantity > 99) return { success: false, error: 'Maximum quantity is 99' };
    await supabase.from('cart_items').update({ quantity: nextQuantity, unit_price: unitPrice, updated_at: new Date().toISOString() } as TablesUpdate<'cart_items'>).eq('id', existing.id);
  } else {
    await supabase.from('cart_items').insert({ cart_id: cart.id, product_id: productId, variant_id: variantId, quantity, unit_price: unitPrice } as TablesInsert<'cart_items'>);
  }
  return { success: true };
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<CartActionResult> {
  const cartId = await verifyCartItemOwnership(cartItemId);
  if (!cartId) return { success: false, error: 'Cart item not found or access denied' };
  const supabase = await createClient();
  if (quantity <= 0) await supabase.from('cart_items').delete().eq('id', cartItemId).eq('cart_id', cartId);
  else if (quantity > 99) return { success: false, error: 'Maximum quantity is 99' };
  else await supabase.from('cart_items').update({ quantity, updated_at: new Date().toISOString() } as TablesUpdate<'cart_items'>).eq('id', cartItemId).eq('cart_id', cartId);
  return { success: true };
}

export async function removeFromDatabaseCart(cartItemId: string): Promise<CartActionResult> {
  const cartId = await verifyCartItemOwnership(cartItemId);
  if (!cartId) return { success: false, error: 'Cart item not found or access denied' };
  const supabase = await createClient();
  await supabase.from('cart_items').delete().eq('id', cartItemId).eq('cart_id', cartId);
  return { success: true };
}

export async function clearDatabaseCart(): Promise<CartActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  const { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).maybeSingle();
  if (cart) await supabase.from('cart_items').delete().eq('cart_id', cart.id);
  return { success: true };
}
