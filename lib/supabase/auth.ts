import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Profile, UserRole } from '@/types/database';

/**
 * Get the current authenticated user from Supabase auth claims.
 * Uses getClaims() for secure identity verification.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) {
    return null;
  }

  return {
    id: claims.sub,
    email: claims.email,
  };
}

/**
 * Get the current user's profile from the database.
 * Returns null if not authenticated or profile not found.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', claims.sub)
    .single();

  return profile;
}

/**
 * Require an authenticated user. Redirects to login if not authenticated.
 * Returns the authenticated user's ID.
 */
export async function requireUser(): Promise<string> {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user.id;
}

/**
 * Require a specific role. Redirects to appropriate page if not authorized.
 * Returns the authenticated profile.
 */
export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/login');
  }

  if (profile.role !== role || !profile.is_active) {
    redirect('/');
  }

  return profile;
}

/**
 * Require admin role. Redirects to homepage if not admin.
 */
export async function requireAdmin(): Promise<Profile> {
  return requireRole('admin');
}

/**
 * Require seller role. Redirects to homepage if not seller.
 */
export async function requireSeller(): Promise<Profile> {
  return requireRole('seller');
}
