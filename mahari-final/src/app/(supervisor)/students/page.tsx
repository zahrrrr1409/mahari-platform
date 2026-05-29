import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StudentCard } from '@/components/students/StudentCard';

export const metadata: Metadata = { title: 'الطلاب' };

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: students } = await supabase
    .from('students')
    .select('*, skill_profiles(profile_strength, ability_signature)')
    .is('deleted_at', null)
    .order('name_ar', { ascending: true });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 3 }}>الطلاب</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {students?.length ?? 0} طالب في كشف متابعتك
          </p>
        </div>
        <Link
          href="/dashboard/students/new"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            6,
            padding:        '9px 16px',
            borderRadius:   'var(--border-radius-md)',
            background:     'var(--teal)',
            color:          '#FFFFFF',
            textDecoration: 'none',
            fontSize:       13,
            fontWeight:     500,
          }}
        >
          <i className="ti ti-plus" aria-hidden="true" style={{ fontSize: 15 }} />
          طالب جديد
        </Link>
      </div>

      {!students?.length ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)', fontSize: 14 }}>
          لا يوجد طلاب في كشف متابعتك بعد.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {students.map(s => (
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
