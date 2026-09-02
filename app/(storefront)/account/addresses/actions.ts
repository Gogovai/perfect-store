'use server';

import { createClient } from '@/lib/supabase/server';
import { addressSchema, type AddressInput } from '@/lib/validations/address';
import type { Address, TablesInsert, TablesUpdate } from '@/types/database';

export type AddressActionResult = { success: boolean; error?: string; address?: Address; addresses?: Address[] };

export async function getUserAddresses(): Promise<Address[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((a) => ({ ...a, full_name: a.recipient_name, address_line_1: a.address_line1 })) as Address[];
}

export async function getAddressById(addressId: string): Promise<Address | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('addresses')
    .select('*')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .single();
  if (error || !data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ...data as any, full_name: (data as any).recipient_name, address_line_1: (data as any).address_line1 } as Address;
}

export async function createAddress(input: AddressInput): Promise<AddressActionResult> {
  const validation = addressSchema.safeParse(input);
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message || 'Invalid address data' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const insertData: TablesInsert<'addresses'> = {
    user_id: user.id, label: validation.data.label, recipient_name: validation.data.fullName,
    phone: validation.data.phone, address_line1: validation.data.addressLine1, address_line2: validation.data.addressLine2 || null,
    city: validation.data.city, region: validation.data.region, postal_code: validation.data.postalCode || null,
    country: 'Ghana', delivery_instructions: null, is_default: validation.data.isDefault,
  };

  if (insertData.is_default) {
    await supabase.from('addresses')
      .update({ is_default: false } as TablesUpdate<'addresses'>)
      .eq('user_id', user.id)
      .eq('is_default', true);
  }
  const { count } = await supabase.from('addresses').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
  if (count === 0) insertData.is_default = true;

  const { data: newAddress, error } = await supabase.from('addresses').insert(insertData).select().single();
  if (error) return { success: false, error: 'Failed to create address' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { success: true, address: { ...newAddress as any, full_name: (newAddress as any).recipient_name, address_line_1: (newAddress as any).address_line1 } as Address };
}

export async function updateAddress(addressId: string, input: AddressInput): Promise<AddressActionResult> {
  const validation = addressSchema.safeParse(input);
  if (!validation.success) return { success: false, error: validation.error.errors[0]?.message || 'Invalid address data' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const updateData: TablesUpdate<'addresses'> = {
    label: validation.data.label, recipient_name: validation.data.fullName, phone: validation.data.phone,
    address_line1: validation.data.addressLine1, address_line2: validation.data.addressLine2 || null,
    city: validation.data.city, region: validation.data.region, postal_code: validation.data.postalCode || null,
    is_default: validation.data.isDefault, updated_at: new Date().toISOString(),
  };
  if (updateData.is_default) {
    await supabase.from('addresses')
      .update({ is_default: false } as TablesUpdate<'addresses'>)
      .eq('user_id', user.id)
      .eq('is_default', true)
      .neq('id', addressId);
  }
  const { data: updated, error } = await supabase.from('addresses')
    .update(updateData)
    .eq('id', addressId)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) return { success: false, error: 'Failed to update address' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { success: true, address: { ...updated as any, full_name: (updated as any).recipient_name, address_line_1: (updated as any).address_line1 } as Address };
}

export async function deleteAddress(addressId: string): Promise<AddressActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  const { error } = await supabase.from('addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', user.id);
  if (error) return { success: false, error: 'Failed to delete address' };
  return { success: true };
}

export async function setDefaultAddress(addressId: string): Promise<AddressActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  await supabase.from('addresses')
    .update({ is_default: false } as TablesUpdate<'addresses'>)
    .eq('user_id', user.id)
    .eq('is_default', true);
  const { data: updated, error } = await supabase.from('addresses')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', addressId)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) return { success: false, error: 'Failed to set default address' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { success: true, address: { ...updated as any, full_name: (updated as any).recipient_name, address_line_1: (updated as any).address_line1 } as Address };
}
