import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ReviewQueueClient } from './_components/ReviewQueueClient';

export const metadata: Metadata = { title: 'مراجعة توصيات الذكاء الاصطناعي' };

export default async function ReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = user.app_metadata?.role as string;
  if (!['supervisor', 'admin'].includes(role)) redirect('/dashboard');

  const { data: recs } = await supabase
    .from('ai_recommendations')
    .select(`
      *,
      students (id, name_ar, name_en)
    `)
    .eq('school_id', user.app_metadata?.school_id ?? '')
    .eq('review_status', 'pending')
    .order('generated_at', { ascending: false });

  return (
    <>
      <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>
        مراجعة توصيات الذكاء الاصطناعي
      </h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        راجع كل توصية قبل ظهورها في ملف الطالب — لا يرى الطالب أو ولي الأمر أي شيء قبل موافقتك
      </p>

      {!recs?.length ? (
        <div style={{
          textAlign:    'center',
          padding:      '3rem',
          background:   'var(--color-background-primary)',
          border:       '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
        }}>
          <i className="ti ti-check" style={{ fontSize: 32, color: 'var(--color-text-success)', display: 'block', marginBottom: 10 }} aria-hidden="true" />
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6 }}>
            لا توجد توصيات تنتظر المراجعة
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            ستظهر التوصيات هنا بعد كل تقييم جديد
          </div>
        </div>
      ) : (
        <ReviewQueueClient recommendations={recs as any[]} />
      )}
    </>
  );
}
