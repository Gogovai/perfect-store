import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { brand } from '@/config/brand';

export const metadata: Metadata = {
  title: `Privacy Policy — ${brand.name}`,
  description: `Privacy policy for ${brand.name} marketplace.`,
};

export default function PrivacyPage() {
  return (
    <div className="py-8 sm:py-12 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="md">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-600 text-sm leading-relaxed">
          <p><em>Last updated: September 2026</em></p>
          <p>
            At {brand.name}, we are committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, and safeguard your personal information when you use our platform.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">Information We Collect</h2>
          <p>
            We collect information you provide directly, such as your name, email address, phone number,
            and delivery addresses when you create an account or place an order. We also collect
            usage data to improve our services.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">How We Use Your Information</h2>
          <p>
            We use your information to process orders, provide customer support, improve our platform,
            and communicate with you about your orders and account.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal information.
            Your payment data is encrypted and never stored on our servers.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a href={`mailto:${brand.contact.email}`} className="text-[#0f2b5b] hover:underline">
              {brand.contact.email}
            </a>.
          </p>
        </div>
      </Container>
    </div>
  );
}
