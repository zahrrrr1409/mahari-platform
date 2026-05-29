import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/dashboard/StatCard';
import { StudentCard } from '@/components/students/StudentCard';

export const metadata: Metadata = { title: 'لوحة المتابعة' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = user.app_metadata?.role as string;
  if (!['supervisor', 'teacher', 'admin'].includes(role)) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('name_ar, name_en').eq('id', user.id).single();

  // Caseload via supervisor_assignments (RLS also applies)
  const { data: assignments } = await supabase
    .from('supervisor_assignments')
    .select('student_id, students(id, name_ar, name_en, grade_level, program_type, skill_profiles(profile_strength, ability_signature))')
    .eq('supervisor_id', user.id)
    .eq('is_active', true);

  const students = (assignments ?? []).map(a => a.students).filter(Boolean) as any[];

  const avgStrength = students.length
    ? Math.round(students.reduce((s, st) => s + (st.skill_profiles?.[0]?.profile_strength ?? 0), 0) / students.length)
    : 0;

  const { count: pendingAiCount } = await supabase
    .from('ai_recommendations')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', user.app_metadata?.school_id ?? '')
    .eq('review_status', 'pending');

  const { count: assessmentCount } = await supabase
    .from('skill_assessments')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', user.app_metadata?.school_id ?? '');

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 3 }}>لوحة المتابعة</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {profile?.name_ar} — رؤية كل طالب من خلال قدراته، لا تصنيفاته
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.5rem' }}>
        <StatCard value={students.length}      labelAr="طلاب في كشف المتابعة" />
        <StatCard value={`${avgStrength}%`}    labelAr="متوسط وضوح القدرات" accent="teal" />
        <StatCard value={assessmentCount ?? 0} labelAr="تقييمات مسجّلة" />
        <StatCard value={pendingAiCount ?? 0}  labelAr="توصيات ذكاء اصطناعي معلّقة" accent={pendingAiCount ? 'danger' : 'default'} />
      </div>

      {students.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)', fontSize: 14, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)' }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>لا يوجد طلاب في كشف متابعتك بعد</div>
          <Link href="/dashboard/students/new" style={{ color: 'var(--teal)', fontSize: 13, fontWeight: 500 }}>
            + إضافة أول طالب
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {students.map(s => s && (
            <StudentCard
              key={s.id}
              id={s.id}
              nameAr={s.name_ar}
              nameEn={s.name_en}
              gradeLevel={s.grade_level}
              programType={s.program_type}
              profileStrength={s.skill_profiles?.[0]?.profile_strength ?? 0}
              abilitySignature={s.skill_profiles?.[0]?.ability_signature ?? null}
            />
          ))}
        </div>
      )}
    </>
  );
}
