'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

export default function NewStudentPage() {
  const router = useRouter();
  const { user } = useUser();

  const [nameAr,      setNameAr]      = useState('');
  const [nameEn,      setNameEn]      = useState('');
  const [gradeLevel,  setGradeLevel]  = useState('');
  const [programType, setProgramType] = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.schoolId) return;
    setSaving(true);
    setError(null);

    // Ensure no forbidden fields are submitted
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from('students')
      .insert({
        name_ar:      nameAr.trim(),
        name_en:      nameEn.trim() || null,
        grade_level:  gradeLevel.trim() || null,
        program_type: programType.trim() || null,
        school_id:    user.schoolId,
      })
      .select('id')
      .single();

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    // Assign this supervisor to the student
    await supabase.from('supervisor_assignments').insert({
      supervisor_id: user.id,
      student_id:    data.id,
      school_id:     user.schoolId,
    });

    router.push(`/dashboard/students/${data.id}`);
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width:        '100%',
    padding:      '10px 12px',
    borderRadius: 'var(--border-radius-md)',
    border:       '0.5px solid var(--color-border-tertiary)',
    fontSize:     14,
    background:   'var(--color-background-primary)',
    color:        'var(--color-text-primary)',
    fontFamily:   'var(--font-sans)',
    outline:      'none',
    boxSizing:    'border-box' as const,
  };

  const labelStyle: React.CSSProperties = {
    display:      'block',
    fontSize:     13,
    fontWeight:   500,
    color:        'var(--color-text-secondary)',
    marginBottom: 6,
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--teal)', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-sans)', padding: 0, display: 'flex', alignItems: 'center', gap: 5 }}
          aria-label="العودة"
        >
          <i className="ti ti-arrow-right" aria-hidden="true" style={{ fontSize: 15 }} />
          رجوع
        </button>
      </div>

      <div style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>إضافة طالب جديد</h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          لا يوجد حقل للتشخيص — ملف القدرات يُبنى من التقييمات والملاحظات
        </p>

        <div style={{
          background:   'var(--color-background-primary)',
          border:       '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          padding:      '20px',
        }}>
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="name-ar" style={labelStyle}>الاسم بالعربية *</label>
              <input id="name-ar" type="text" required value={nameAr} onChange={e => setNameAr(e.target.value)} style={inputStyle} placeholder="مثال: فهد الشمري" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="name-en" style={labelStyle}>الاسم بالإنجليزية</label>
              <input id="name-en" type="text" value={nameEn} onChange={e => setNameEn(e.target.value)} style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }} placeholder="e.g. Fahad Al-Shamri" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1rem' }}>
              <div>
                <label htmlFor="grade" style={labelStyle}>الصف الدراسي</label>
                <input id="grade" type="text" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} style={inputStyle} placeholder="مثال: الصف العاشر" />
              </div>
              <div>
                <label htmlFor="program" style={labelStyle}>نوع البرنامج</label>
                <select
                  id="program"
                  value={programType}
                  onChange={e => setProgramType(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">اختر نوع البرنامج</option>
                  <option value="التعليم الدامج">التعليم الدامج</option>
                  <option value="غرفة المصادر">غرفة المصادر</option>
                  <option value="برنامج الانتقال">برنامج الانتقال</option>
                  <option value="الفصل الخاص">الفصل الخاص</option>
                </select>
              </div>
            </div>

            {error && (
              <div role="alert" style={{ padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-danger)', color: 'var(--color-text-danger)', fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => router.back()} style={{ padding: '10px 16px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-tertiary)', background: 'none', color: 'var(--color-text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving || !nameAr.trim()}
                style={{ flex: 1, padding: '11px', borderRadius: 'var(--border-radius-md)', border: 'none', background: saving || !nameAr.trim() ? 'var(--color-border-tertiary)' : 'var(--teal)', color: '#FFFFFF', fontSize: 13, fontWeight: 500, cursor: saving || !nameAr.trim() ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}
              >
                {saving ? 'جارٍ الإنشاء…' : 'إنشاء الملف'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
