import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { brand } from '@/config/brand';
import { HelpCircle, ShoppingBag, Package, CreditCard, User, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: `Help Center — ${brand.name}`,
  description: `Get help with your ${brand.name} account, orders, and more.`,
};

const categories = [
  {
    icon: ShoppingBag,
    title: 'Shopping',
    description: 'How to browse, search, and purchase products',
    links: [
      { label: 'How to place an order', href: '#' },
      { label: 'Payment methods', href: '#' },
      { label: 'Promo codes & discounts', href: '#' },
    ],
  },
  {
    icon: Package,
    title: 'Orders & Delivery',
    description: 'Track orders, delivery times, and shipping info',
    links: [
      { label: 'Track your order', href: '/account/orders' },
      { label: 'Delivery times', href: '#' },
      { label: 'Shipping policies', href: '#' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments',
    description: 'Payment options, refunds, and billing',
    links: [
      { label: 'Payment methods accepted', href: '#' },
      { label: 'How to get a refund', href: '#' },
      { label: 'Payment security', href: '#' },
    ],
  },
  {
    icon: User,
    title: 'Account',
    description: 'Manage your account, profile, and settings',
    links: [
      { label: 'Create an account', href: '/register' },
      { label: 'Reset your password', href: '/forgot-password' },
      { label: 'Manage addresses', href: '/account/addresses' },
    ],
  },
  {
    icon: Truck,
    title: 'Selling',
    description: 'Everything about selling on our platform',
    links: [
      { label: 'How to become a seller', href: '/seller/apply' },
      { label: 'Seller guidelines', href: '/seller/apply' },
      { label: 'Seller FAQ', href: '/seller/apply' },
    ],
  },
  {
    icon: HelpCircle,
    title: 'General',
    description: 'About Perfect Store and general questions',
    links: [
      { label: 'About Perfect Store', href: '/about' },
      { label: 'Contact us', href: '/contact' },
      { label: 'Privacy policy', href: '/privacy' },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="py-8 sm:py-12 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="lg">
        <div className="text-center mb-10">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 mb-4">
            <HelpCircle size={28} className="text-[#0f2b5b]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Find answers to common questions or get in touch with our support team.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.title} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <category.icon size={20} className="text-[#0f2b5b]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">{category.title}</h2>
                  <p className="text-xs text-gray-500">{category.description}</p>
                </div>
              </div>
              <ul className="space-y-2 mt-4">
                {category.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-gray-600 hover:text-[#0f2b5b] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Still need help?</h2>
          <p className="text-sm text-gray-600 mb-4">
            Our support team is available to help you with any questions.
          </p>
          <a
            href={`mailto:${brand.contact.email}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f2b5b] text-white rounded-lg text-sm font-medium hover:bg-[#1a3d7c] transition-colors"
          >
            Contact Support
          </a>
        </div>
      </Container>
    </div>
  );
}
