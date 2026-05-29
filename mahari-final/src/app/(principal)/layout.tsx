import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PrincipalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!['principal', 'admin'].includes(user.app_metadata?.role ?? '')) redirect('/dashboard');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-secondary)' }}>
      <header style={{ background: 'var(--color-background-primary)', borderBottom: '0.5px solid var(--color-border-tertiary)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--teal)' }}>مهاري</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>لوحة قائد المدرسة</div>
      </header>
      <main id="main-content" style={{ padding: '1.5rem 2rem' }}>{children}</main>
    </div>
  );
}
