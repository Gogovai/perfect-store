import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { brand } from '@/config/brand';
import { Shield, Users, Truck, Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: `About Us — ${brand.name}`,
  description: `Learn about ${brand.name}, Ghana's leading multi-vendor marketplace.`,
};

export default function AboutPage() {
  return (
    <div className="py-8 sm:py-12 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="md">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">About {brand.name}</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
          <p>
            {brand.name} is Ghana&apos;s leading multi-vendor marketplace, connecting buyers with
            trusted sellers from across the country. Our mission is to make online shopping
            accessible, reliable, and enjoyable for everyone in Ghana.
          </p>

          <p>
            Founded with the vision of empowering Ghanaian businesses, we provide a platform
            where sellers of all sizes can reach customers nationwide, and where buyers can
            discover quality products at competitive prices.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8 not-prose">
            {[
              { icon: Shield, title: 'Trust & Safety', description: 'Every transaction is protected with our buyer protection guarantee.' },
              { icon: Users, title: 'Community', description: 'Thousands of sellers and millions of products at your fingertips.' },
              { icon: Truck, title: 'Fast Delivery', description: 'Reliable delivery to every region in Ghana.' },
              { icon: Heart, title: 'Customer First', description: 'Dedicated support to ensure your satisfaction.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <item.icon size={20} className="text-[#0f2b5b]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <p>
            Whether you&apos;re looking for electronics, fashion, home goods, or anything else,
            {brand.name} is your go-to destination for online shopping in Ghana.
          </p>
        </div>
      </Container>
    </div>
  );
}
