'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Menu,
  X,
  ShoppingCart,
  User,
  LogOut,
  ChevronDown,
  Search,
  Store,
  HelpCircle,
  Truck,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { CartButton } from '@/components/cart/CartButton';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { brand } from '@/config/brand';
import { signOutAction } from '@/app/auth/actions';
import type { Profile } from '@/types/database';

interface HeaderProps {
  profile: Profile | null;
}

export function Header({ profile }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const isLoggedIn = Boolean(profile);
  const firstName = profile?.first_name?.trim() || 'Customer';
  const lastName = profile?.last_name?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName.charAt(0)}${lastName.charAt(0) || ''}`.toUpperCase();

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();

    if (!query) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
    setSearchQuery('');
    setMobileMenuOpen(false);
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOutAction();
    } catch {
      setIsSigningOut(false);
    }
  }

  function closeMenus() {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-40">
        <div className="hidden bg-[#0f2b5b] text-xs text-white/80 lg:block">
          <Container>
            <div className="flex h-8 items-center justify-between">
              <div className="flex items-center gap-5">
                <Link
                  href="/seller/apply"
                  className="flex items-center gap-1 transition-colors hover:text-white"
                >
                  <Store size={12} />
                  <span>Sell on {brand.shortName}</span>
                </Link>
                <span className="text-white/30">|</span>
                <Link
                  href="/help"
                  className="flex items-center gap-1 transition-colors hover:text-white"
                >
                  <HelpCircle size={12} />
                  <span>Help Center</span>
                </Link>
                <span className="text-white/30">|</span>
                <Link
                  href="/orders/track"
                  className="flex items-center gap-1 transition-colors hover:text-white"
                >
                  <Truck size={12} />
                  <span>Track Order</span>
                </Link>
              </div>
              <div className="flex items-center gap-1 transition-colors hover:text-white">
                <Headphones size={12} />
                <span>Customer Support</span>
              </div>
            </div>
          </Container>
        </div>

        <div className="border-b border-gray-200 bg-white shadow-sm">
          <Container>
            <div className="flex h-14 items-center gap-3 lg:h-16 lg:gap-6">
              <Logo size="md" className="shrink-0" />

              <form onSubmit={handleSearch} className="hidden max-w-2xl flex-1 md:flex">
                <div className="relative flex w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search for products, brands, and more..."
                    className="flex-1 rounded-l-lg border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-12 text-sm text-gray-900 placeholder-gray-500 transition-all focus:border-[#0f2b5b] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2b5b]/20"
                    aria-label="Search products"
                  />
                  <button
                    type="submit"
                    className="rounded-r-lg bg-[#0f2b5b] px-5 text-white transition-colors hover:bg-[#1a3d7c]"
                    aria-label="Search"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </form>

              <div className="ml-auto flex items-center gap-1 sm:gap-2">
                <CartButton />

                <div className="hidden items-center md:flex">
                  {isLoggedIn ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setUserMenuOpen((open) => !open)}
                        className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                        aria-label="User menu"
                        aria-expanded={userMenuOpen}
                      >
                        {profile?.avatar_url ? (
                          <Image
                            src={profile.avatar_url}
                            alt={fullName}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${brand.colors.primaryLight}20` }}
                          >
                            <span
                              className="text-xs font-bold"
                              style={{ color: brand.colors.primary }}
                            >
                              {initials}
                            </span>
                          </div>
                        )}
                        <span className="max-w-[100px] truncate text-sm font-medium text-gray-700">
                          {firstName}
                        </span>
                        <ChevronDown size={14} className="text-gray-500" />
                      </button>

                      {userMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setUserMenuOpen(false)}
                            aria-hidden="true"
                          />
                          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                            <div className="border-b border-gray-100 px-4 py-3">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {fullName}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                {profile?.email || 'No email provided'}
                              </p>
                            </div>

                            <Link
                              href="/account"
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <User size={16} />
                              My Account
                            </Link>
                            <Link
                              href="/wishlist"
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <ShoppingCart size={16} />
                              Wishlist
                            </Link>
                            <Link
                              href="/orders"
                              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Truck size={16} />
                              My Orders
                            </Link>

                            {profile?.role === 'seller' && (
                              <Link
                                href="/seller/dashboard"
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <Store size={16} />
                                Seller Dashboard
                              </Link>
                            )}

                            {profile?.role === 'admin' && (
                              <Link
                                href="/admin/dashboard"
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <User size={16} />
                                Admin Dashboard
                              </Link>
                            )}

                            <div className="my-1 border-t border-gray-100" />
                            <button
                              type="button"
                              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setUserMenuOpen(false);
                                void handleSignOut();
                              }}
                              disabled={isSigningOut}
                            >
                              <LogOut size={16} />
                              {isSigningOut ? 'Signing out...' : 'Sign out'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-2">
                      <Link href="/login">
                        <Button variant="ghost" size="sm" className="text-gray-600">
                          Sign in
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button size="sm" className="bg-[#0f2b5b] hover:bg-[#1a3d7c]">
                          Sign up
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="p-2 text-gray-600 transition-colors hover:text-gray-900 lg:hidden"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  aria-label="Toggle menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </Container>
        </div>

        {mobileMenuOpen && (
          <nav className="border-b border-gray-200 bg-white shadow-lg lg:hidden">
            <Container>
              <div className="flex flex-col gap-3 py-4">
                <form onSubmit={handleSearch}>
                  <div className="relative flex">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search products..."
                      className="flex-1 rounded-l-lg border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-12 text-sm text-gray-900 placeholder-gray-500 focus:border-[#0f2b5b] focus:bg-white focus:outline-none"
                      aria-label="Search products"
                    />
                    <button
                      type="submit"
                      className="rounded-r-lg bg-[#0f2b5b] px-4 text-white"
                      aria-label="Search"
                    >
                      <Search size={18} />
                    </button>
                  </div>
                </form>

                <Link
                  href="/seller/apply"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={closeMenus}
                >
                  <Store size={16} className="text-gray-400" />
                  Sell on {brand.shortName}
                </Link>
                <Link
                  href="/orders/track"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={closeMenus}
                >
                  <Truck size={16} className="text-gray-400" />
                  Track Order
                </Link>
                <Link
                  href="/help"
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={closeMenus}
                >
                  <HelpCircle size={16} className="text-gray-400" />
                  Help Center
                </Link>

                {isLoggedIn ? (
                  <>
                    <div className="mt-1 border-t border-gray-200 pt-3">
                      <div className="mb-2 flex items-center gap-3 px-2">
                        {profile?.avatar_url ? (
                          <Image
                            src={profile.avatar_url}
                            alt={fullName}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full"
                            style={{ backgroundColor: `${brand.colors.primaryLight}20` }}
                          >
                            <span
                              className="text-sm font-bold"
                              style={{ color: brand.colors.primary }}
                            >
                              {initials}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{fullName}</p>
                          <p className="text-xs text-gray-500">
                            {profile?.email || 'No email provided'}
                          </p>
                        </div>
                      </div>

                      <Link
                        href="/account"
                        className="block rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={closeMenus}
                      >
                        My Account
                      </Link>
                      <Link
                        href="/wishlist"
                        className="block rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={closeMenus}
                      >
                        Wishlist
                      </Link>
                      <Link
                        href="/orders"
                        className="block rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={closeMenus}
                      >
                        My Orders
                      </Link>
                      {profile?.role === 'seller' && (
                        <Link
                          href="/seller/dashboard"
                          className="block rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={closeMenus}
                        >
                          Seller Dashboard
                        </Link>
                      )}
                      {profile?.role === 'admin' && (
                        <Link
                          href="/admin/dashboard"
                          className="block rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={closeMenus}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-lg border-t border-gray-200 px-2 py-2 pt-3 text-sm text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        void handleSignOut();
                      }}
                      disabled={isSigningOut}
                    >
                      <LogOut size={16} />
                      {isSigningOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 border-t border-gray-200 pt-2">
                    <Link href="/login" className="flex-1">
                      <Button variant="secondary" className="w-full" size="sm">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/register" className="flex-1">
                      <Button className="w-full" size="sm">
                        Sign up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </Container>
          </nav>
        )}
      </header>

      <CartDrawer />
    </>
  );
}
