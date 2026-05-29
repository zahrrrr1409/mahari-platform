import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Root page — determines where to send the user based on their role.
 * Unauthenticated users → /login
 * Authenticated users   → role-appropriate section
 */
export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = user.app_metadata?.role as string | undefined;

  switch (role) {
    case 'parent':    redirect('/parent');
    case 'principal': redirect('/school');
    default:          redirect('/dashboard');
  }
}
