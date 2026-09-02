import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { brand } from '@/config/brand';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0f2b5b] text-white">
      {/* Main footer */}
      <Container>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 py-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <Logo size="md" linked={false} className="[&_div:first-child]:bg-white [&_span:first-child]:text-[#0f2b5b]" />
              <p className="text-white/60 mt-1 text-sm">{brand.shortName}</p>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              {brand.description}
            </p>
            {/* Contact */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Mail size={14} />
                <span>{brand.contact.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Phone size={14} />
                <span>{brand.contact.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin size={14} />
                <span>{brand.contact.address}</span>
              </div>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Customer Service</h3>
            <ul className="space-y-2.5">
              <li><Link href="/help" className="text-sm text-white/60 hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="/account/orders" className="text-sm text-white/60 hover:text-white transition-colors">Track Order</Link></li>
              <li><Link href="/returns" className="text-sm text-white/60 hover:text-white transition-colors">Returns & Refunds</Link></li>
              <li><Link href="/contact" className="text-sm text-white/60 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">About {brand.shortName}</h3>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">Press</Link></li>
            </ul>
          </div>

          {/* Shopping */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Shopping</h3>
            <ul className="space-y-2.5">
              <li><Link href="/products" className="text-sm text-white/60 hover:text-white transition-colors">Browse Products</Link></li>
              <li><Link href="/categories" className="text-sm text-white/60 hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/products?sort=popular" className="text-sm text-white/60 hover:text-white transition-colors">Deals & Offers</Link></li>
              <li><Link href="/wishlist" className="text-sm text-white/60 hover:text-white transition-colors">Wishlist</Link></li>
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Sell on {brand.shortName}</h3>
            <ul className="space-y-2.5">
              <li><Link href="/seller/apply" className="text-sm text-white/60 hover:text-white transition-colors">Start Selling</Link></li>
              <li><Link href="/seller/apply" className="text-sm text-white/60 hover:text-white transition-colors">Seller Guidelines</Link></li>
              <li><Link href="/seller/apply" className="text-sm text-white/60 hover:text-white transition-colors">Seller Support</Link></li>
              <li><Link href="/seller/apply" className="text-sm text-white/60 hover:text-white transition-colors">Seller FAQ</Link></li>
            </ul>
          </div>
        </div>
      </Container>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5">
            <p className="text-sm text-white/40">
              © {currentYear} {brand.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              {brand.social.twitter && (
                <a href={brand.social.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-white/40 hover:text-white transition-colors" aria-label="Twitter">
                  Twitter
                </a>
              )}
              {brand.social.facebook && (
                <a href={brand.social.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-white/40 hover:text-white transition-colors" aria-label="Facebook">
                  Facebook
                </a>
              )}
              {brand.social.instagram && (
                <a href={brand.social.instagram} target="_blank" rel="noopener noreferrer" className="text-sm text-white/40 hover:text-white transition-colors" aria-label="Instagram">
                  Instagram
                </a>
              )}
              {brand.social.tiktok && (
                <a href={brand.social.tiktok} target="_blank" rel="noopener noreferrer" className="text-sm text-white/40 hover:text-white transition-colors" aria-label="TikTok">
                  TikTok
                </a>
              )}
              {/* Placeholder social links - shown until real accounts exist */}
              {!brand.social.twitter && !brand.social.facebook && !brand.social.instagram && (
                <span className="text-xs text-white/20">Social media coming soon</span>
              )}
            </div>
          </div>
        </Container>
      </div>
    </footer>
  );
}
