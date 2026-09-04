'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth';

export type AuthFormState = {
  success: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
};

/**
 * Server action for user login.
 * Validates input, authenticates with Supabase, and redirects based on role.
 */
export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  // Intended destination (e.g. /login?redirect=/checkout). Only allow
  // internal paths so this can never be abused as an open redirect.
  const rawRedirect = formData.get('redirect');
  const safeRedirect =
    typeof rawRedirect === 'string' &&
    rawRedirect.startsWith('/') &&
    !rawRedirect.startsWith('//') &&
    !rawRedirect.includes('\\') &&
    !rawRedirect.includes(':')
      ? rawRedirect
      : null;

  // Validate input
  const result = loginSchema.safeParse(rawData);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    });
    return { success: false, error: null, fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    // New accounts are auto-confirmed (MAILER_AUTOCONFIRM + the
    // trg_autoconfirm_new_user trigger), so this app never requires email
    // verification and sends no confirmation links. If GoTrue still reports
    // "Email not confirmed" it means the project auth config has regressed;
    // point to support rather than an inbox that will never contain a link,
    // and avoid leaking whether the account exists.
    if (error.message.includes('Email not confirmed')) {
      return {
        success: false,
        error: 'Unable to sign in. Please try again or contact support.',
      };
    }
    return {
      success: false,
      error: 'Invalid email or password. Please try again.',
    };
  }

  // Get user claims to determine role-based redirect
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (claims) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', claims.sub)
      .single();

    revalidatePath('/', 'layout');

    const role = profile && typeof profile === 'object' && 'role' in profile ? (profile as { role: string }).role : null;

    if (role === 'admin') {
      redirect('/admin/dashboard');
    }
    if (role === 'seller') {
      redirect('/seller/dashboard');
    }
  }

  revalidatePath('/', 'layout');
  redirect(safeRedirect ?? '/');
}

/**
 * Server action for user registration.
 * Creates Supabase Auth user with metadata. Profile is created by database trigger.
 */
export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const rawData = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    acceptTerms: formData.get('acceptTerms') === 'on',
  };

  // Validate input
  const result = registerSchema.safeParse(rawData);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    });
    return { success: false, error: null, fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        first_name: result.data.firstName,
        last_name: result.data.lastName,
        phone: result.data.phone,
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return {
        success: false,
        error: 'An account with this email already exists. Please sign in instead.',
      };
    }
    return {
      success: false,
      error: 'Unable to create account. Please try again later.',
    };
  }

  return {
    success: true,
    error: null,
  };
}

/**
 * Server action for forgot password.
 * Sends password reset email. Does not reveal whether the email exists.
 */
export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const rawData = {
    email: formData.get('email') as string,
  };

  const result = forgotPasswordSchema.safeParse(rawData);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    });
    return { success: false, error: null, fieldErrors };
  }

  const supabase = await createClient();

  // Always show success message to prevent account enumeration
  await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  });

  return {
    success: true,
    error: null,
  };
}

/**
 * Server action for resetting password.
 * Updates the user's password after they've clicked the reset link.
 */
export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const rawData = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  const result = resetPasswordSchema.safeParse(rawData);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    });
    return { success: false, error: null, fieldErrors };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });

  if (error) {
    return {
      success: false,
      error: 'Unable to reset password. The link may have expired. Please request a new one.',
    };
  }

  return {
    success: true,
    error: null,
  };
}

/**
 * Server action for signing out.
 * Invalidates session, clears cookies, and redirects to homepage.
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
