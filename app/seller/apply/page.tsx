import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { brand } from '@/config/brand';
import { Store, CheckCircle, ArrowRight, TrendingUp, Shield, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: `Sell on ${brand.name} — Seller Application`,
  description: `Join ${brand.name} as a seller and reach thousands of customers across Ghana.`,
};

export default function SellerApplyPage() {
  const benefits = [
    {
      icon: Users,
      title: 'Reach Thousands of Customers',
      description: 'Access a growing marketplace of active shoppers across Ghana.',
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Powerful seller tools to manage inventory, orders, and analytics.',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Get paid reliably with our secure payment processing system.',
    },
  ];

  const steps = [
    { step: 1, title: 'Apply', description: 'Submit your seller application with your business details.' },
    { step: 2, title: 'Get Verified', description: 'Our team reviews your application within 48 hours.' },
    { step: 3, title: 'Start Selling', description: 'List your products and start reaching customers.' },
  ];

  return (
    <div className="py-12 sm:py-20 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="lg">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0f2b5b] mb-6">
            <Store size={32} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Sell on {brand.name}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of successful sellers on Ghana&apos;s leading multi-vendor marketplace.
            Start reaching customers across the country today.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 mb-4">
                <benefit.icon size={24} className="text-[#0f2b5b]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* How it Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.step} className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-[#0f2b5b] text-white flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                </div>
                <p className="text-sm text-gray-600 ml-13">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What You Get</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              'Free seller dashboard',
              'Inventory management tools',
              'Order management system',
              'Seller analytics & reports',
              'Customer support assistance',
              'Marketing & promotion tools',
              'Secure payment processing',
              'Multi-location delivery',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle size={18} className="text-green-500 shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Ready to start selling? Contact our seller support team to get started.
          </p>
          <a
            href={`mailto:sellers@${brand.contact.email.split('@')[1]}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f2b5b] text-white rounded-lg font-medium hover:bg-[#1a3d7c] transition-colors"
          >
            Contact Seller Support <ArrowRight size={18} />
          </a>
        </div>
      </Container>
    </div>
  );
}
