'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignatureGenerateButton({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  async function handleGenerate() {
    setLoading(true);
    await fetch('/api/ai/signature', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    });
    setDone(true);
    setLoading(false);
    router.refresh();
  }

  if (done) return (
    <p style={{ fontSize: 12, color: 'var(--teal)', marginTop: 4 }}>
      ✓ تم إنشاء مسودة البصمة — راجعها في قائمة مراجعة الذكاء الاصطناعي
    </p>
  );

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      style={{
        padding:      '8px 14px',
        borderRadius: 'var(--border-radius-md)',
        border:       '1px dashed var(--teal)',
        background:   'var(--teal-light)',
        color:        'var(--teal)',
        fontSize:     12,
        fontWeight:   500,
        cursor:       loading ? 'not-allowed' : 'pointer',
        fontFamily:   'var(--font-sans)',
        display:      'flex',
        alignItems:   'center',
        gap:          6,
      }}
    >
      <i className="ti ti-sparkles" aria-hidden="true" style={{ fontSize: 14 }} />
      {loading ? 'جارٍ الإنشاء…' : 'إنشاء بصمة القدرة بالذكاء الاصطناعي'}
    </button>
  );
}
