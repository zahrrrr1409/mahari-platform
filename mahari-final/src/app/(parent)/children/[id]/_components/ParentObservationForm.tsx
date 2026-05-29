'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ParentObservationForm({ studentId, schoolId, parentId }: { studentId: string; schoolId: string; parentId: string }) {
  const [content, setContent] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.length < 20) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('observations').insert({
      student_id:   studentId,
      observer_id:  parentId,
      school_id:    schoolId,
      observer_role: 'parent',
      setting:      'home',
      content,
      is_verified:  false,
    });
    setDone(true);
    setSaving(false);
  }

  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: 16 }}>
      <h2 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>ملاحظة من المنزل</h2>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        شاركنا ما لاحظته هذا الأسبوع — كل ملاحظة تُثري ملف قدرات ابنك
      </p>

      {done ? (
        <div style={{ padding: '10px 14px', background: 'var(--color-background-success)', borderRadius: 'var(--border-radius-md)', color: 'var(--color-text-success)', fontSize: 13 }}>
          ✓ تم إرسال ملاحظتك للمشرف للمراجعة. شكراً!
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            placeholder="ماذا لاحظت على ابنك هذا الأسبوع؟ مهارة، سلوك، تصرف لافت…"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-tertiary)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
          />
          <button
            type="submit"
            disabled={saving || content.length < 20}
            style={{ padding: '9px 18px', borderRadius: 'var(--border-radius-md)', border: 'none', background: content.length >= 20 ? 'var(--teal)' : 'var(--color-border-tertiary)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: content.length >= 20 ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-sans)' }}
          >
            {saving ? 'جارٍ الإرسال…' : 'إرسال الملاحظة'}
          </button>
        </form>
      )}
    </div>
  );
}
