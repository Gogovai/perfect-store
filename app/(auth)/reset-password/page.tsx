'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Container';
import { resetPasswordAction, type AuthFormState } from '@/app/auth/actions';

const initialState: AuthFormState = {
  success: false,
  error: null,
};

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);

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
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
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
                  Password updated
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in <ArrowRight size={16} />
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
              <form action={formAction} className="space-y-5">
                {/* Password */}
                <div className="relative">
                  <Input
                    label="New password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Min. 8 characters"
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

                {/* Confirm Password */}
                <div className="relative">
                  <Input
                    label="Confirm new password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Repeat your password"
                    icon={<Lock size={18} />}
                    error={state.fieldErrors?.confirmPassword}
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password requirements */}
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Password must contain:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• At least 8 characters</li>
                    <li>• One uppercase letter</li>
                    <li>• One lowercase letter</li>
                    <li>• One number</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isPending}
                  disabled={isPending}
                >
                  Reset password <ArrowRight size={18} />
                </Button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
