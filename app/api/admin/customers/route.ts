import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminApi } from '@/lib/supabase/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

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
  const { id, is_active } = (body ?? {}) as { id?: unknown; is_active?: unknown };
  if (typeof id !== 'string' || !id) {
    return NextResponse.json(
      { success: false, error: 'Missing customer id' },
      { status: 400 }
    );
  }
  if (typeof is_active !== 'boolean') {
    return NextResponse.json(
      { success: false, error: 'is_active must be a boolean' },
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
    .from('profiles')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('role', 'customer');

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  // 4. Revalidate pages that surface customer status.
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/customers');

  return NextResponse.json({
    success: true,
    message: `Customer ${is_active ? 'activated' : 'deactivated'}.`,
  });
}