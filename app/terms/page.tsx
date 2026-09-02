import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { brand } from '@/config/brand';

export const metadata: Metadata = {
  title: `Terms of Service — ${brand.name}`,
  description: `Terms of service for ${brand.name} marketplace.`,
};

export default function TermsPage() {
  return (
    <div className="py-8 sm:py-12 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="md">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-600 text-sm leading-relaxed">
          <p><em>Last updated: September 2026</em></p>
          <p>
            Welcome to {brand.name}. By using our platform, you agree to these Terms of Service.
            Please read them carefully before using our services.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">User Accounts</h2>
          <p>
            You must create an account to make purchases. You are responsible for maintaining
            the confidentiality of your account credentials and for all activities under your account.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">Orders and Payments</h2>
          <p>
            All orders are subject to product availability. Prices are set by individual sellers
            and may change without notice. Payment processing is handled securely through our
            approved payment partners.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">Returns and Refunds</h2>
          <p>
            Products may be returned within 7 days of delivery if they are defective or not as
            described. Contact our support team to initiate a return.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href={`mailto:${brand.contact.email}`} className="text-[#0f2b5b] hover:underline">
              {brand.contact.email}
            </a>.
          </p>
        </div>
      </Container>
    </div>
  );
}
