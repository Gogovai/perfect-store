import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { User, Mail, Phone, Shield, ShoppingBag, Heart, MapPin, LogOut, ChevronRight, Camera } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getCurrentProfile } from '@/lib/supabase/auth';
import { signOutAction } from '@/app/auth/actions';

export default async function AccountPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/login');
  }

  const initials = `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase();

  const navItems = [
    {
      label: 'Orders',
      href: '/orders',
      icon: ShoppingBag,
      description: 'View and track your orders',
    },
    {
      label: 'Wishlist',
      href: '/wishlist',
      icon: Heart,
      description: 'Your saved products',
    },
    {
      label: 'Addresses',
      href: '/addresses',
      icon: MapPin,
      description: 'Manage shipping addresses',
    },
    {
      label: 'Security',
      href: '/account/security',
      icon: Shield,
      description: 'Password and security settings',
    },
  ];

  return (
    <div className="py-8 sm:py-12 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="lg">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Account</h1>
            <p className="mt-1 text-gray-600">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="flex flex-col items-center py-8">
                  {/* Avatar */}
                  <div className="relative mb-4">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={`${profile.first_name} ${profile.last_name}`}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-600">{initials}</span>
                      </div>
                    )}
                    <button
                      className="absolute bottom-0 right-0 h-7 w-7 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700"
                      aria-label="Change avatar"
                    >
                      <Camera size={14} />
                    </button>
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
                  {profile.phone && (
                    <p className="text-sm text-gray-500 mt-0.5">{profile.phone}</p>
                  )}

                  <div className="mt-4 w-full">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {profile.role}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sign Out */}
              <form action={signOutAction} className="mt-4">
                <Button
                  type="submit"
                  variant="ghost"
                  fullWidth
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Sign out
                </Button>
              </form>
            </div>

            {/* Navigation */}
            <div className="lg:col-span-2 space-y-4">
              {/* Profile Info */}
              <Card>
                <CardContent>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User size={18} className="text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Full Name</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {profile.first_name} {profile.last_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail size={18} className="text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone size={18} className="text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {profile.phone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="group">
                    <Card hoverable>
                      <CardContent className="flex items-center gap-4 py-5">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                          <item.icon size={20} className="text-gray-600 group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500 shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
