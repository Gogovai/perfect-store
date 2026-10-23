import { redirect } from 'next/navigation';

/** Public seller storefronts are disabled for this single-store application. */
export default function SellerStorefrontPage(): never {
  redirect('/products');
}
