import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getCurrentProfile } from '@/lib/supabase/auth';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Perfect Store - Ghana Marketplace',
  description: 'Shop quality products from trusted sellers on Ghana\'s leading multi-vendor marketplace',
  keywords: 'marketplace, shopping, ghana, online store, ecommerce',
  openGraph: {
    title: 'Perfect Store',
    description: 'Shop quality products from trusted sellers on Ghana\'s leading multi-vendor marketplace',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-screen flex flex-col bg-white text-gray-900">
        <Header profile={profile} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
