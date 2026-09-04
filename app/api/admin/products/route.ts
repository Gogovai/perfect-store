import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminApi } from '@/lib/supabase/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { ProductStatus } from '@/types/database';

const PRODUCT_STATUSES: ProductStatus[] = [
  'draft',
  'pending_review',
  'active',
  'inactive',
  'rejected',
];

export async function PATCH(request: Request) {
  // 1. Authenticate the caller as an admin.
  const session = await requireAdminApi();
  if (session.error) {
    return NextResponse.json(
      { success: false, error: session.error },
      { status: session.status }
    );
  }

  // 2. Parse + validate the payload.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
  const { id, status } = (body ?? {}) as { id?: unknown; status?: unknown };
  if (typeof id !== 'string' || !id) {
    return NextResponse.json(
      { success: false, error: 'Missing product id' },
      { status: 400 }
    );
  }
  if (typeof status !== 'string' || !PRODUCT_STATUSES.includes(status as ProductStatus)) {
    return NextResponse.json(
      { success: false, error: 'Invalid product status' },
      { status: 400 }
    );
  }

  // 3. Update the record via the service-role client (bypasses RLS).
  let adminClient;
  try {
    adminClient = getSupabaseAdmin();
  } catch (e) {
    return NextResponse.json(
      { success: false, error: (e as Error).message },
      { status: 500 }
    );
  }

  const { error } = await adminClient
    .from('products')
    .update({ status: status as ProductStatus, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  // 4. Revalidate pages that surface product status.
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath('/seller/dashboard');

  return NextResponse.json({ success: true, message: `Product marked ${status}.` });
}