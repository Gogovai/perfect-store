import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { brand } from '@/config/brand';
import { ContactForm } from '@/components/contact/ContactForm';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: `Contact Us — ${brand.name}`,
  description: `Get in touch with ${brand.name} support team.`,
};

export default function ContactPage() {
  return (
    <div className="py-8 sm:py-12 bg-gray-50 min-h-[calc(100vh-8rem)]">
      <Container size="md">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-600 mb-8">We&apos;d love to hear from you. Here&apos;s how to reach us.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {[
            { icon: Mail, label: 'Email', value: brand.contact.email, href: `mailto:${brand.contact.email}` },
            { icon: Phone, label: 'Phone', value: brand.contact.phone, href: brand.contact.phone.includes('X') ? null : `tel:${brand.contact.phone.replace(/\s/g, '')}` },
            { icon: MapPin, label: 'Address', value: brand.contact.address },
            { icon: Clock, label: 'Business Hours', value: 'Mon - Fri, 9:00 AM - 5:00 PM' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <item.icon size={20} className="text-[#0f2b5b]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  {item.href ? (
                    <a href={item.href} className="text-sm font-medium text-gray-900 hover:text-[#0f2b5b] transition-colors">
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{item.value}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send us a message</h2>
          <p className="mb-4 text-sm text-gray-500">
            Messages go straight to our support team. Already signed in? Messages are tracked under My Support.
          </p>
          <ContactForm />
        </div>
      </Container>
    </div>
  );
}
