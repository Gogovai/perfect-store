'use server';

/**
 * Address management server actions.
 * Handles CRUD operations for user addresses with Supabase RLS.
 */

import { createClient } from '@/lib/supabase/server';
import { addressSchema, type AddressInput } from '@/lib/validations/address';
import type { Address, TablesInsert, TablesUpdate } from '@/types/database';

export type AddressActionResult = {
  success: boolean;
  error?: string;
  address?: Address;
  addresses?: Address[];
};

/**
 * Get all addresses for the current user.
 */
export async function getUserAddresses(): Promise<Address[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data as Address[];
}

/**
 * Get a single address by ID (must belong to current user).
 */
export async function getAddressById(addressId: string): Promise<Address | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;

  return data as Address;
}

/**
 * Create a new address.
 */
export async function createAddress(input: AddressInput): Promise<AddressActionResult> {
  const validation = addressSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || 'Invalid address data' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const insertData: TablesInsert<'addresses'> = {
    user_id: user.id,
    label: validation.data.label,
    full_name: validation.data.fullName,
    phone: validation.data.phone,
    address_line_1: validation.data.addressLine1,
    address_line_2: validation.data.addressLine2 || null,
    city: validation.data.city,
    region: validation.data.region,
    postal_code: validation.data.postalCode || null,
    country: 'Ghana',
    is_default: validation.data.isDefault,
  };

  // If setting as default, unset other defaults first
  if (insertData.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false } as TablesUpdate<'addresses'>)
      .eq('user_id', user.id)
      .eq('is_default', true);
  }

  // If this is the first address, make it default
  const { count } = await supabase
    .from('addresses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (count === 0) {
    insertData.is_default = true;
  }

  const { data: newAddress, error } = await supabase
    .from('addresses')
    .insert(insertData as TablesInsert<'addresses'>)
    .select()
    .single();

  if (error) {
    return { success: false, error: 'Failed to create address' };
  }

  return { success: true, address: newAddress as Address };
}

/**
 * Update an existing address.
 */
export async function updateAddress(
  addressId: string,
  input: AddressInput
): Promise<AddressActionResult> {
  const validation = addressSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message || 'Invalid address data' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const updateData: TablesUpdate<'addresses'> = {
    label: validation.data.label,
    full_name: validation.data.fullName,
    phone: validation.data.phone,
    address_line_1: validation.data.addressLine1,
    address_line_2: validation.data.addressLine2 || null,
    city: validation.data.city,
    region: validation.data.region,
    postal_code: validation.data.postalCode || null,
    is_default: validation.data.isDefault,
    updated_at: new Date().toISOString(),
  };

  // If setting as default, unset other defaults first
  if (updateData.is_default) {
    await supabase
      .from('addresses')
      .update({ is_default: false } as TablesUpdate<'addresses'>)
      .eq('user_id', user.id)
      .eq('is_default', true)
      .neq('id', addressId);
  }

  const { data: updated, error } = await supabase
    .from('addresses')
    .update(updateData as TablesUpdate<'addresses'>)
    .eq('id', addressId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: 'Failed to update address' };
  }

  return { success: true, address: updated as Address };
}

/**
 * Delete an address.
 */
export async function deleteAddress(addressId: string): Promise<AddressActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: 'Failed to delete address' };
  }

  return { success: true };
}

/**
 * Set an address as default (and unset all others).
 */
export async function setDefaultAddress(addressId: string): Promise<AddressActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Unset all defaults
  await supabase
    .from('addresses')
    .update({ is_default: false } as TablesUpdate<'addresses'>)
    .eq('user_id', user.id)
    .eq('is_default', true);

  // Set the target as default
  const { data: updated, error } = await supabase
    .from('addresses')
    .update({ is_default: true, updated_at: new Date().toISOString() } as TablesUpdate<'addresses'>)
    .eq('id', addressId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: 'Failed to set default address' };
  }

  return { success: true, address: updated as Address };
}
