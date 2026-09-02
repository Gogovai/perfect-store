'use client';

import Link from 'next/link';

const themes: Record<string, { bg: string; accent: string; items: string[] }> = {
  electronics: { bg: '#eaf0f8', accent: '#0f2b5b', items: ['PHONE', 'LAPTOP', 'AUDIO'] },
  'phones-tablets': { bg: '#edf3fb', accent: '#1d4d78', items: ['PHONE', 'TABLET', 'WATCH'] },
  'computers-accessories': { bg: '#eef1f5', accent: '#334155', items: ['LAPTOP', 'MONITOR', 'KEYBOARD'] },
  fashion: { bg: '#fff0eb', accent: '#e85d26', items: ['SHOES', 'BAG', 'WEAR'] },
  'home-kitchen': { bg: '#edf4f7', accent: '#1d4d78', items: ['CHAIR', 'PAN', 'LAMP'] },
  'beauty-personal-care': { bg: '#f9edf3', accent: '#9a315f', items: ['CARE', 'BEAUTY', 'BODY'] },
  health: { bg: '#eaf7f1', accent: '#059669', items: ['CARE', 'FIT', 'WELLNESS'] },
  'sports-fitness': { bg: '#eaf7f2', accent: '#047857', items: ['BALL', 'FIT', 'SPORT'] },
  automotive: { bg: '#eef1f4', accent: '#475569', items: ['AUTO', 'PARTS', 'TOOLS'] },
  'baby-products': { bg: '#fff5e8', accent: '#b45309', items: ['BABY', 'TOYS', 'CARE'] },
  groceries: { bg: '#f2f7e8', accent: '#365314', items: ['FOOD', 'FRESH', 'HOME'] },
  'office-school': { bg: '#edf2ff', accent: '#1e40af', items: ['PEN', 'BOOK', 'DESK'] },
  appliances: { bg: '#f4edfa', accent: '#6b21a8', items: ['TV', 'COOK', 'HOME'] },
};

export function CategoryVisual({ slug, href, className = '' }: { slug: string; href?: string; className?: string }) {
  const theme = themes[slug] || { bg: '#eef2f7', accent: '#0f2b5b', items: ['SHOP', 'MORE', 'TODAY'] };
  const content = (
    <div className={`relative overflow-hidden rounded-2xl border border-black/5 ${className}`} style={{ background: theme.bg }}>
      <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-20" style={{ background: theme.accent }} />
      <div className="relative grid min-h-44 grid-cols-3 items-end gap-2 p-5">
        {theme.items.map((item, index) => (
          <div key={item} className="flex flex-col items-center gap-2">
            <div
              className="flex aspect-square w-full max-w-24 items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm"
              style={{ transform: `translateY(${index === 1 ? -10 : 0}px) rotate(${index === 0 ? -4 : index === 2 ? 4 : 0}deg)` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl text-[9px] font-black tracking-wider" style={{ background: `${theme.accent}18`, color: theme.accent }}>
                {item.slice(0, 4)}
              </div>
            </div>
            <span className="text-[9px] font-semibold tracking-wide opacity-60">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return href ? <Link href={href} className="block group">{content}</Link> : content;
}

export const CATEGORY_VISUAL_SLUGS = Object.keys(themes);
