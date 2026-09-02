import Link from 'next/link';

const NAV = [
  {href: '/seller/dashboard', label: 'Dashboard'},
  {href: '/seller/orders', label: 'Orders'},
  {href: '/seller/apply', label: 'Store Profile'},
];

export default function SellerLayout({children}: {children: React.ReactNode}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white lg:block">
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Seller Center</p>
        </div>
        <nav className="space-y-1 px-3">
          {NAV.map(item => (
            <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-[#0f2b5b]">
              {item.label}
            </Link>
          ))}
          <Link href="/" className="mt-4 block rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-100">
            ← Back to Store
          </Link>
        </nav>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
