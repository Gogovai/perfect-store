'use client';

import React, { useActionState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Container';
import { forgotPasswordAction, type AuthFormState } from '@/app/auth/actions';

const initialState: AuthFormState = {
  success: false,
  error: null,
};

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

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
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 sm:rounded-lg">
            {/* Success message */}
            {state.success && (
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Check your email
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  If an account exists with that email, we&apos;ve sent a password reset link.
                  Please check your inbox and follow the instructions.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  <ArrowLeft size={16} />
                  Back to sign in
                </Link>
              </div>
            )}

            {/* Error message */}
            {state.error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{state.error}</p>
              </div>
            )}

            {!state.success && (
              <>
                <form action={formAction} className="space-y-5">
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

                  <Button
                    type="submit"
                    fullWidth
                    isLoading={isPending}
                    disabled={isPending}
                  >
                    Send reset link <ArrowRight size={18} />
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft size={16} />
                    Back to sign in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
