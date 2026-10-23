import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { getCurrentProfile } from '@/lib/supabase/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Perfect Store — Clothing Store',
  description: 'Shop men’s and women’s clothing with delivery across Ghana.',
  keywords: 'clothing, fashion, menswear, womenswear, Ghana, online shopping',
  openGraph: {
    title: 'Perfect Store — Clothing Store',
    description: 'Shop men’s and women’s clothing with delivery across Ghana.',
    type: 'website',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-screen flex flex-col bg-white text-gray-900">
        <Header profile={profile} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
