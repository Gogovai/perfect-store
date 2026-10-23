import { redirect } from 'next/navigation';

/** Seller approval and seller management are not needed in a single-owner store. */
export default function AdminSellersPage(): never {
  redirect('/admin/dashboard');
}
