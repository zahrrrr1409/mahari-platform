'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

interface Observation {
  id:         string;
  content:    string;
  setting:    string;
  is_verified: boolean;
  observed_at: string;
  observer_id: string;
}

export default function ObservePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const studentId = params.id as string;

  const [observations, setObservations] = useState<Observation[]>([]);
  const [content, setContent]   = useState('');
  const [setting, setSetting]   = useState('classroom');
  const [saving,  setSaving]    = useState(false);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('observations')
      .select('*')
      .eq('student_id', studentId)
      .is('deleted_at', null)
      .order('observed_at', { ascending: false })
      .then(({ data }) => { setObservations(data ?? []); setLoading(false); });
  }, [studentId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!user || content.length < 20) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('observations').insert({
      student_id:   studentId,
      observer_id:  user.id,
      school_id:    user.schoolId ?? '',
      observer_role: user.role as any,
      setting:      setting as any,
      content,
      is_verified:  user.role === 'supervisor' || user.role === 'admin',
    });
    setContent('');
    setSaving(false);
    router.refresh();
    // Refetch
    const { data } = await supabase.from('observations').select('*').eq('student_id', studentId).is('deleted_at', null).order('observed_at', { ascending: false });
    setObservations(data ?? []);
  }

  const settingLabel = (s: string) => ({ classroom: 'الفصل', home: 'المنزل', community: 'المجتمع', other: 'أخرى' }[s] ?? s);

  return (
    <>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
        <i className="ti ti-arrow-right" aria-hidden="true" /> رجوع
      </button>

      <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '1.5rem' }}>سجل الملاحظات</h1>

      {/* Add observation form */}
      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: 18, marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 12 }}>إضافة ملاحظة</h2>
        <form onSubmit={handleAdd} noValidate>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 5 }}>السياق</label>
            <select value={setting} onChange={e => setSetting(e.target.value)} style={{ width: '100%', padding: '9px 11px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-tertiary)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none' }}>
              <option value="classroom">الفصل الدراسي</option>
              <option value="home">المنزل</option>
              <option value="community">البيئة المجتمعية</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 5 }}>الملاحظة (20 حرف على الأقل)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-tertiary)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} placeholder="صِف بدقة ما شاهدته…" />
          </div>
          <button type="submit" disabled={saving || content.length < 20} style={{ padding: '9px 18px', borderRadius: 'var(--border-radius-md)', border: 'none', background: content.length >= 20 ? 'var(--teal)' : 'var(--color-border-tertiary)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: content.length >= 20 ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-sans)' }}>
            {saving ? 'جارٍ الحفظ…' : 'إضافة'}
          </button>
        </form>
      </div>

      {/* Observations list */}
      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>جارٍ التحميل…</p>
      ) : observations.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>لا توجد ملاحظات مسجّلة بعد.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {observations.map(o => (
            <div key={o.id} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 100, background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)' }}>{settingLabel(o.setting)}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {!o.is_verified && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 100, background: 'var(--color-background-warning)', color: 'var(--color-text-warning)' }}>تنتظر التحقق</span>}
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{new Date(o.observed_at).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.6, margin: 0 }}>{o.content}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
