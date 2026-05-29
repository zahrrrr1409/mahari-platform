import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AssessmentStepper } from '@/components/assessments/AssessmentStepper';

export const metadata: Metadata = { title: 'تقييم جديد' };

interface Props { params: { id: string } }

export default async function AssessPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = user.app_metadata?.role as string;
  if (!['supervisor', 'teacher', 'admin'].includes(role)) redirect('/login');

  const { data: student } = await supabase
    .from('students')
    .select('id, name_ar, name_en, school_id')
    .eq('id', params.id)
    .single();
  if (!student) notFound();

  const { data: domains } = await supabase
    .from('skill_domains')
    .select('id, name_en, name_ar, color_hex, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  // Latest level per domain
  const { data: latestAssessments } = await supabase
    .from('skill_assessments')
    .select('domain_id, maturity_level, assessed_at')
    .eq('student_id', params.id)
    .order('assessed_at', { ascending: false });

  const currentLevels: Record<string, number> = {};
  for (const a of latestAssessments ?? []) {
    if (!currentLevels[a.domain_id]) currentLevels[a.domain_id] = a.maturity_level;
  }

  return (
    <>
      <Link href={`/dashboard/students/${params.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--teal)', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: '1.25rem' }}>
        <i className="ti ti-arrow-right" aria-hidden="true" /> {student.name_ar}
      </Link>

      <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>تقييم جديد</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        سجّل ما شاهدته مباشرة — كل تقييم يُبنى على دليل حقيقي
      </p>

      <AssessmentStepper
        studentId={params.id}
        studentName={student.name_ar}
        schoolId={student.school_id}
        domains={(domains ?? []).map(d => ({ id: d.id, nameEn: d.name_en, nameAr: d.name_ar, colorHex: d.color_hex ?? '#9B9890' }))}
        currentLevels={currentLevels}
      />
    </>
  );
}
