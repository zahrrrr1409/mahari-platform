import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlansList } from './_components/PlansList';

export const metadata: Metadata = { title: 'خطط المهارات' };
interface Props { params: { id: string } }

export default async function PlanPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase.from('students').select('id, name_ar, school_id').eq('id', params.id).single();
  if (!student) notFound();

  const { data: plans } = await supabase
    .from('skill_plans')
    .select('*, skill_domains(name_en, name_ar, color_hex)')
    .eq('student_id', params.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const { data: domains } = await supabase.from('skill_domains').select('id, name_en, name_ar').eq('is_active', true).order('display_order');

  return (
    <>
      <Link href={`/dashboard/students/${params.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--teal)', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: '1.25rem' }}>
        <i className="ti ti-arrow-right" aria-hidden="true" /> {student.name_ar}
      </Link>

      <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>خطط المهارات</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        كل خطة تربط هدفاً مهارياً بأنشطة ملموسة وجدول زمني
      </p>

      <PlansList
        plans={plans ?? []}
        domains={domains ?? []}
        studentId={params.id}
        schoolId={student.school_id}
      />
    </>
  );
}
