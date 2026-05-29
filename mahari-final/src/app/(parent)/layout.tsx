import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (user.app_metadata?.role !== 'parent') redirect('/dashboard');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-secondary)' }}>
      <header style={{ background: 'var(--color-background-primary)', borderBottom: '0.5px solid var(--color-border-tertiary)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--teal)' }}>مهاري</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>بوابة ولي الأمر</div>
      </header>
      <main id="main-content" style={{ padding: '1.5rem', maxWidth: 680, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
