import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'var(--color-background-secondary)',
      padding:        '2rem',
      textAlign:      'center',
      fontFamily:     'var(--font-sans)',
    }}>
      <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--teal)', marginBottom: 20 }}>مهاري</div>
      <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>404</div>
      <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 8 }}>
        الصفحة غير موجودة
      </h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
        الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
      </p>
      <Link
        href="/dashboard"
        style={{
          padding:        '10px 20px',
          borderRadius:   'var(--border-radius-md)',
          background:     'var(--teal)',
          color:          '#fff',
          textDecoration: 'none',
          fontSize:       13,
          fontWeight:     500,
        }}
      >
        العودة للوحة المتابعة
      </Link>
    </div>
  );
}
