'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Container';
import { loginAction, type AuthFormState } from '@/app/auth/actions';

const initialState: AuthFormState = {
  success: false,
  error: null,
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Container size="sm">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Logo */}
          <div className="flex justify-center">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">PS</span>
              </div>
            </Link>
          </div>

          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 sm:rounded-lg">
            {/* Success: Password reset */}
            {searchParams.get('reset') === 'success' && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
              </div>
            )}

            {/* Redirect notice */}
            {redirect && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Please sign in to continue to {redirect}.
                </p>
              </div>
            )}

            {/* Error message */}
            {state.error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{state.error}</p>
              </div>
            )}

            <form action={formAction} className="space-y-5">
              {redirect && <input type="hidden" name="redirect" value={redirect} />}
              <Input
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                error={state.fieldErrors?.email}
                disabled={isPending}
              />

              <div className="relative">
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  icon={<Lock size={18} />}
                  error={state.fieldErrors?.password}
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isPending}
                disabled={isPending}
              >
                Sign in <ArrowRight size={18} />
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}
