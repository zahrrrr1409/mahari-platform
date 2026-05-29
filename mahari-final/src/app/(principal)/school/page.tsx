import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/dashboard/StatCard';

export const metadata: Metadata = { title: 'إحصاءات المدرسة' };

export default async function SchoolPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const schoolId = user.app_metadata?.school_id as string | null;
  if (!schoolId) redirect('/login');

  // Aggregate stats — principal sees school-level anonymized data
  const { count: studentCount } = await supabase
    .from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null);

  const { data: profiles } = await supabase
    .from('skill_profiles').select('profile_strength').eq('school_id', schoolId);

  const avgStrength = profiles?.length
    ? Math.round(profiles.reduce((s, p) => s + p.profile_strength, 0) / profiles.length)
    : 0;

  const { count: assessmentCount } = await supabase
    .from('skill_assessments').select('id', { count: 'exact', head: true }).eq('school_id', schoolId);

  const { count: pendingAI } = await supabase
    .from('ai_recommendations').select('id', { count: 'exact', head: true }).eq('school_id', schoolId).eq('review_status', 'pending');

  // Domain distribution
  const { data: domainStats } = await supabase
    .from('skill_assessments')
    .select('skill_domains(name_en, name_ar), maturity_level')
    .eq('school_id', schoolId);

  const domainMap: Record<string, { nameEn: string; nameAr: string; levels: number[] }> = {};
  for (const a of domainStats ?? []) {
    const d = a.skill_domains as any;
    if (!d?.name_en) continue;
    if (!domainMap[d.name_en]) domainMap[d.name_en] = { nameEn: d.name_en, nameAr: d.name_ar, levels: [] };
    domainMap[d.name_en]!.levels.push(a.maturity_level);
  }

  return (
    <>
      <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>إحصاءات المدرسة</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>بيانات مجمّعة — لا يُعرض أي محتوى فردي</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.5rem' }}>
        <StatCard value={studentCount ?? 0}   labelAr="إجمالي الطلاب المسجّلين" />
        <StatCard value={`${avgStrength}%`}   labelAr="متوسط وضوح القدرات" accent="teal" />
        <StatCard value={assessmentCount ?? 0} labelAr="إجمالي التقييمات المسجّلة" />
        <StatCard value={pendingAI ?? 0}       labelAr="توصيات ذكاء اصطناعي معلّقة" accent={pendingAI ? 'danger' : 'default'} />
      </div>

      {/* Domain averages */}
      <h2 style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 12 }}>متوسط النضج المهاري بالمجالات</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {Object.values(domainMap).map(d => {
          const avg = d.levels.length ? (d.levels.reduce((s, v) => s + v, 0) / d.levels.length).toFixed(1) : '—';
          const pct = d.levels.length ? Math.round((parseFloat(avg) / 4) * 100) : 0;
          return (
            <div key={d.nameEn} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: '12px 14px' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>{d.nameEn}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginBottom: 10 }}>{d.nameAr}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--teal)' }}>{avg}</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>/ 4</span>
              </div>
              <div style={{ height: 5, background: 'var(--color-border-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--teal)', borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 5 }}>
                {d.levels.length} تقييم · {pct}% نحو الاستقلالية
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
