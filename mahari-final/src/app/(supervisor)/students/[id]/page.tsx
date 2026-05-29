import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AbilitySignature } from '@/components/students/AbilitySignature';
import SignatureGenerateButton from './_components/SignatureGenerateButton';
import { DomainCard } from '@/components/students/DomainCard';
import { CapabilityRadar } from '@/components/students/CapabilityRadar';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase.from('students').select('name_ar').eq('id', params.id).single();
  return { title: data?.name_ar ?? 'ملف الطالب' };
}

export default async function StudentProfilePage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const role = user.app_metadata?.role as string;

  // Fetch student + profile (RLS enforces access rights)
  const { data: student, error } = await supabase
    .from('students')
    .select(`*, skill_profiles(*)`)
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (error || !student) notFound();

  const profile = student.skill_profiles?.[0] ?? null;

  // Fetch latest assessment per domain
  const { data: assessments } = await supabase
    .from('skill_assessments')
    .select('domain_id, maturity_level, assessed_at, skill_domains(id, name_en, name_ar, color_hex, display_order)')
    .eq('student_id', params.id)
    .order('assessed_at', { ascending: false });

  // Build latest level per domain
  const levelByDomainId: Record<string, number> = {};
  const domainMetaById: Record<string, { nameEn: string; nameAr: string; colorHex: string }> = {};
  for (const a of assessments ?? []) {
    if (!levelByDomainId[a.domain_id]) {
      levelByDomainId[a.domain_id] = a.maturity_level;
      const d = a.skill_domains as any;
      domainMetaById[a.domain_id] = { nameEn: d.name_en, nameAr: d.name_ar, colorHex: d.color_hex ?? '#9B9890' };
    }
  }

  // Fetch DB skill_domains for the full list (needed for radar + cards)
  const { data: dbDomains } = await supabase
    .from('skill_domains')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const radarData = (dbDomains ?? []).map(d => ({
    domain:   d.name_en.split(' ')[0] ?? d.name_en,
    domainAr: d.name_ar,
    value:    Object.entries(levelByDomainId).find(([id]) => domainMetaById[id]?.nameEn === d.name_en)?.[1] ?? 0,
  }));

  const isSupervisor = ['supervisor', 'admin'].includes(role);
  const profileStrength = profile?.profile_strength ?? 0;

  return (
    <>
      {/* Back link */}
      <Link href="/dashboard/students" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--teal)', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: '1.25rem' }}>
        <i className="ti ti-arrow-right" aria-hidden="true" /> رجوع للطلاب
      </Link>

      {/* Profile header */}
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '20px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 500, color: 'var(--teal)', flexShrink: 0 }}>
              {student.name_en?.charAt(0) ?? student.name_ar.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>{student.name_ar}</h1>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {student.name_en}{student.grade_level ? ` · ${student.grade_level}` : ''}{student.program_type ? ` · ${student.program_type}` : ''}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'end' }}>
            <div style={{ fontSize: 28, fontWeight: 500, color: 'var(--teal)' }}>{profileStrength}%</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>وضوح القدرات</div>
            {isSupervisor && (
              <Link href={`/dashboard/students/${params.id}/assess`} style={{ display: 'inline-block', marginTop: 8, padding: '6px 12px', background: 'var(--teal)', color: '#fff', borderRadius: 'var(--border-radius-md)', fontSize: 11, fontWeight: 500, textDecoration: 'none' }}>
                + تقييم جديد
              </Link>
            )}
          </div>
        </div>

        <AbilitySignature
          signature={profile?.ability_signature ?? null}
          draft={isSupervisor ? (profile?.sig_draft ?? null) : null}
          isSupervisor={isSupervisor}
          studentNameAr={student.name_ar}
        />

        {isSupervisor && !profile?.ability_signature && !profile?.sig_draft && (assessments?.length ?? 0) > 0 && (
          <div style={{ marginTop: 10 }}>
            <SignatureGenerateButton studentId={params.id} />
          </div>
        )}
      </div>

      {/* Two-column: radar + domain cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>
        {/* Radar */}
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>خريطة القدرات</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 10 }}>المجالات الستة</div>
          <CapabilityRadar data={radarData} />
        </div>

        {/* Domain cards */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 10 }}>مستوى النضج المهاري</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(dbDomains ?? []).map(d => {
              const entry = Object.entries(levelByDomainId).find(([id]) => domainMetaById[id]?.nameEn === d.name_en);
              const level = entry ? entry[1] : 0;
              return (
                <DomainCard
                  key={d.id}
                  nameEn={d.name_en}
                  nameAr={d.name_ar}
                  color={d.color_hex ?? '#9B9890'}
                  level={level}
                />
              );
            })}
          </div>

          {/* Quick links */}
          {isSupervisor && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {[
                { href: 'observe', label: 'الملاحظات', icon: 'ti-eye' },
                { href: 'plan',    label: 'خطط المهارات', icon: 'ti-list-check' },
              ].map(l => (
                <Link key={l.href} href={`/dashboard/students/${params.id}/${l.href}`} style={{ flex: 1, padding: '9px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 12, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <i className={`ti ${l.icon}`} aria-hidden="true" style={{ fontSize: 14 }} /> {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

