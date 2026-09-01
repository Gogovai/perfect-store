import { requireUser } from '@/lib/supabase/auth';
import { redirect } from 'next/navigation';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await requireUser();

  if (!userId) {
    redirect('/login');
  }

  return <>{children}</>;
}
