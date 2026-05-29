'use client';

import { useEffect } from 'react';

export default function ParentError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[Parent error]', error); }, [error]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
      <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 8 }}>
        تعذّر تحميل الصفحة
      </h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
        يرجى المحاولة مرة أخرى.
      </p>
      <button onClick={reset} style={{ padding: '9px 18px', borderRadius: 'var(--border-radius-md)', border: 'none', background: 'var(--teal)', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
        إعادة المحاولة
      </button>
    </div>
  );
}
