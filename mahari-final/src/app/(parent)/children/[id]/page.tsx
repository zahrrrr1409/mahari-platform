import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AbilitySignature } from '@/components/students/AbilitySignature';
import { DomainCard } from '@/components/students/DomainCard';
import { CapabilityRadar } from '@/components/students/CapabilityRadar';
import { ParentObservationForm } from './_components/ParentObservationForm';

export const metadata: Metadata = { title: 'ملف القدرات' };
interface Props { params: { id: string } }

export default async function ParentChildPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Verify parent is linked to this child
  const { data: link } = await supabase
    .from('parent_student_links')
    .select('student_id')
    .eq('parent_id', user.id)
    .eq('student_id', params.id)
    .not('activated_at', 'is', null)
    .single();
  if (!link) notFound();

  const { data: student } = await supabase
    .from('students')
    .select('*, skill_profiles(*)')
    .eq('id', params.id)
    .single();
  if (!student) notFound();

  const profile = student.skill_profiles?.[0];

  const { data: assessments } = await supabase
    .from('skill_assessments')
    .select('domain_id, maturity_level, assessed_at, skill_domains(name_en, name_ar, color_hex)')
    .eq('student_id', params.id)
    .order('assessed_at', { ascending: false });

  const levelByDomain: Record<string, { level: number; nameEn: string; nameAr: string; colorHex: string }> = {};
  for (const a of assessments ?? []) {
    if (!levelByDomain[a.domain_id]) {
      const d = a.skill_domains as any;
      levelByDomain[a.domain_id] = { level: a.maturity_level, nameEn: d.name_en, nameAr: d.name_ar, colorHex: d.color_hex ?? '#9B9890' };
    }
  }

  const { data: dbDomains } = await supabase.from('skill_domains').select('*').eq('is_active', true).order('display_order');

  const radarData = (dbDomains ?? []).map(d => ({
    domain:   d.name_en.split(' ')[0] ?? d.name_en,
    domainAr: d.name_ar,
    value:    Object.values(levelByDomain).find(v => v.nameEn === d.name_en)?.level ?? 0,
  }));

  return (
    <>
      <Link href="/parent" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--teal)', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: '1.25rem' }}>
        <i className="ti ti-arrow-right" aria-hidden="true" /> رجوع
      </Link>

      {/* Header */}
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: 18, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>{student.name_ar}</h1>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              {student.name_en}{student.grade_level ? ` · ${student.grade_level}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'end' }}>
            <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--teal)' }}>{profile?.profile_strength ?? 0}%</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>وضوح القدرات</div>
          </div>
        </div>
        {/* Parent sees only approved signature */}
        <AbilitySignature signature={profile?.ability_signature ?? null} isSupervisor={false} studentNameAr={student.name_ar} />
      </div>

      {/* Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 10 }}>خريطة القدرات</div>
          <CapabilityRadar data={radarData} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 10 }}>مجالات النمو</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(dbDomains ?? []).map(d => {
              const entry = Object.values(levelByDomain).find(v => v.nameEn === d.name_en);
              return <DomainCard key={d.id} nameEn={d.name_en} nameAr={d.name_ar} color={d.color_hex ?? '#9B9890'} level={entry?.level ?? 0} />;
            })}
          </div>
        </div>
      </div>

      {/* Home observation */}
      <ParentObservationForm studentId={params.id} schoolId={student.school_id} parentId={user.id} />
    </>
  );
}
