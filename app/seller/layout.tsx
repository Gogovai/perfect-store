import { redirect } from 'next/navigation';

/** Seller routes are disabled: this application is a single-owner store, not a marketplace. */
export default function SellerLayout(): never {
  redirect('/');
}
