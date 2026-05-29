import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const role = user.app_metadata?.role as string | undefined;
  if (!['supervisor', 'teacher', 'admin'].includes(role ?? '')) {
    // Wrong role — send to their correct section
    if (role === 'parent')    redirect('/parent');
    if (role === 'principal') redirect('/school');
    redirect('/login');
  }

  // Fetch pending AI count for sidebar badge
  const { count: pendingAiCount } = await supabase
    .from('ai_recommendations')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', user.app_metadata?.school_id ?? '')
    .eq('review_status', 'pending');

  return (
    <div
      style={{
        display:    'flex',
        minHeight:  '100vh',
        background: 'var(--color-background-secondary)',
      }}
    >
      <Sidebar pendingAiCount={pendingAiCount ?? 0} />
      <main
        id="main-content"
        tabIndex={-1}
        style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}
      >
        {children}
      </main>
    </div>
  );
}
