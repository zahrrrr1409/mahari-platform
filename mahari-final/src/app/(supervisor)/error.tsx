'use client';

import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary for the supervisor route group.
 * Catches unhandled errors in Server Components and shows a recovery UI
 * instead of the default Next.js error page.
 */
export default function SupervisorError({ error, reset }: Props) {
  useEffect(() => {
    // Log to your error tracking service here (Sentry, etc.)
    console.error('[Supervisor error]', error);
  }, [error]);

  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '60vh',
      padding:        '2rem',
      textAlign:      'center',
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 8 }}>
        حدث خطأ غير متوقع
      </h2>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 20, maxWidth: 400, lineHeight: 1.6 }}>
        تعذّر تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة إلى لوحة المتابعة.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={reset}
          style={{
            padding:      '9px 18px',
            borderRadius: 'var(--border-radius-md)',
            border:       'none',
            background:   'var(--teal)',
            color:        '#fff',
            fontSize:     13,
            fontWeight:   500,
            cursor:       'pointer',
            fontFamily:   'var(--font-sans)',
          }}
        >
          إعادة المحاولة
        </button>
        <a
          href="/dashboard"
          style={{
            padding:        '9px 18px',
            borderRadius:   'var(--border-radius-md)',
            border:         '0.5px solid var(--color-border-tertiary)',
            color:          'var(--color-text-secondary)',
            fontSize:       13,
            cursor:         'pointer',
            textDecoration: 'none',
            fontFamily:     'var(--font-sans)',
          }}
        >
          لوحة المتابعة
        </a>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: 20, fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'start', maxWidth: 600 }}>
          <summary style={{ cursor: 'pointer', marginBottom: 6 }}>تفاصيل الخطأ (development only)</summary>
          <pre style={{ background: '#1F2937', color: '#E5E7EB', padding: 12, borderRadius: 6, overflow: 'auto', fontSize: 11, lineHeight: 1.6 }}>
            {error.message}
            {error.stack ? '\n\n' + error.stack : ''}
          </pre>
        </details>
      )}
    </div>
  );
}
