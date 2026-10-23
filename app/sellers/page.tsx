import { redirect } from 'next/navigation';

/** Public seller directories are not part of the single-store experience. */
export default function SellersPage(): never {
  redirect('/products');
}
