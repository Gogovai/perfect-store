'use client';

import React, { useState, useActionState } from 'react';
import Link from 'next/link';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Container } from '@/components/ui/Container';
import { registerAction, type AuthFormState } from '@/app/auth/actions';

const initialState: AuthFormState = {
  success: false,
  error: null,
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 sm:rounded-lg">
            {/* Success message */}
            {state.success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Account created successfully!
                    </p>
                    <p className="mt-1 text-sm text-green-700">
                      Please check your email to verify your account before signing in.
                    </p>
                  </div>
                </div>
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
                {/* Name fields */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Input
                    label="First name"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    placeholder="John"
                    icon={<User size={18} />}
                    error={state.fieldErrors?.firstName}
                    disabled={isPending}
                  />
                  <Input
                    label="Last name"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    placeholder="Doe"
                    icon={<User size={18} />}
                    error={state.fieldErrors?.lastName}
                    disabled={isPending}
                  />
                </div>

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

                <Input
                  label="Phone number"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="+233 50 123 4567"
                  icon={<Phone size={18} />}
                  error={state.fieldErrors?.phone}
                  disabled={isPending}
                />

                {/* Password */}
                <div className="relative">
                  <Input
                    label="Password"
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
                    label="Confirm password"
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

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="acceptTerms"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isPending}
                    />
                    <span className="text-sm text-gray-600">
                      I agree to the{' '}
                      <Link href="/terms" className="text-blue-600 hover:text-blue-500 font-medium">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:text-blue-500 font-medium">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {state.fieldErrors?.acceptTerms && (
                    <p className="mt-1 text-sm text-red-600">{state.fieldErrors.acceptTerms}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isPending}
                  disabled={isPending}
                >
                  Create account <ArrowRight size={18} />
                </Button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
