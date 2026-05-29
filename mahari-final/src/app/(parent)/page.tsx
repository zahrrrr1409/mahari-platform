import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'أبنائي' };

export default async function ParentHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: links } = await supabase
    .from('parent_student_links')
    .select('student_id, students(id, name_ar, name_en, grade_level, program_type, skill_profiles(profile_strength, ability_signature))')
    .eq('parent_id', user.id)
    .not('activated_at', 'is', null);

  const children = (links ?? []).map(l => l.students).filter(Boolean) as any[];

  return (
    <>
      <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>ملفات أبنائي</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        انقر على اسم ابنك لعرض ملف قدراته
      </p>

      {children.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', fontSize: 14, color: 'var(--color-text-secondary)' }}>
          لم يتم ربط أي طالب بحسابك بعد. تواصل مع المشرف.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children.map((child: any) => {
            const profile = child.skill_profiles?.[0];
            return (
              <Link key={child.id} href={`/parent/children/${child.id}`} style={{ display: 'block', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '16px', textDecoration: 'none', transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>{child.name_ar}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                      {child.name_en}{child.grade_level ? ` · ${child.grade_level}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'end' }}>
                    <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--teal)' }}>{profile?.profile_strength ?? 0}%</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>وضوح القدرات</div>
                  </div>
                </div>
                {profile?.ability_signature && (
                  <div style={{ padding: '10px 12px', background: 'var(--teal-light)', borderRadius: 'var(--border-radius-md)', borderInlineStart: '2px solid var(--teal)' }}>
                    <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--teal-mid)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>✦ بصمة القدرة</div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      {profile.ability_signature.length > 120 ? profile.ability_signature.slice(0, 120) + '…' : profile.ability_signature}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
