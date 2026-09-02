import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { brand } from '@/config/brand';

export const metadata: Metadata = {
  title: `Returns & Refunds — ${brand.name}`,
  description: `Learn about our return and refund policies.`,
};

export default function ReturnsPage() {
  return (
    <div className="py-8 sm:py-12 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="md">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Returns & Refunds</h1>
        <div className="prose prose-gray max-w-none space-y-4 text-gray-600 text-sm leading-relaxed">
          <p>
            We want you to be satisfied with your purchase. If you&apos;re not happy with your order,
            here&apos;s what you need to know about returns and refunds.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">Return Policy</h2>
          <p>
            Items can be returned within 7 days of delivery if they are defective, damaged, or
            not as described in the product listing. Items must be in their original condition
            and packaging.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">How to Request a Return</h2>
          <p>
            Contact our support team with your order number and reason for return.
            We will guide you through the return process.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">Refunds</h2>
          <p>
            Refunds are processed within 5-10 business days after we receive the returned item.
            The refund will be credited to your original payment method.
          </p>
          <h2 className="text-lg font-semibold text-gray-900 !mt-6">Contact</h2>
          <p>
            For return or refund inquiries, contact us at{' '}
            <a href={`mailto:${brand.contact.email}`} className="text-[#0f2b5b] hover:underline">
              {brand.contact.email}
            </a>.
          </p>
        </div>
      </Container>
    </div>
  );
}
