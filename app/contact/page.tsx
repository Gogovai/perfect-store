import React from 'react';
import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { brand } from '@/config/brand';
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
            { icon: Phone, label: 'Phone', value: brand.contact.phone, href: `tel:${brand.contact.phone.replace(/\s/g, '')}` },
            { icon: MapPin, label: 'Address', value: brand.contact.address, href: '#' },
            { icon: Clock, label: 'Business Hours', value: 'Mon - Fri, 9:00 AM - 5:00 PM', href: '#' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <item.icon size={20} className="text-[#0f2b5b]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{item.label}</p>
                  <a href={item.href} className="text-sm font-medium text-gray-900 hover:text-[#0f2b5b] transition-colors">
                    {item.value}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send us a message</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
                <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Email</label>
                <input type="email" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Subject</label>
              <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="How can we help?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Message</label>
              <textarea rows={4} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Tell us more..." />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-[#0f2b5b] text-white rounded-lg text-sm font-medium hover:bg-[#1a3d7c] transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </Container>
    </div>
  );
}
