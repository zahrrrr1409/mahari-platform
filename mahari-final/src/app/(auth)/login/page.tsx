'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Suspense boundary required: useSearchParams() needs it in Next.js 14
function LoginForm() {
  const router      = useRouter();
  const params      = useSearchParams();
  const redirectTo  = params.get('redirectTo') ?? '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    if (authError || !data.user) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      setLoading(false);
      return;
    }

    const role = data.user.app_metadata?.role as string | undefined;
    const destination =
      role === 'parent'    ? '/parent'    :
      role === 'principal' ? '/school'    :
      redirectTo;

    router.push(destination);
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    width:         '100%',
    padding:       '10px 12px',
    borderRadius:  'var(--border-radius-md)',
    border:        '0.5px solid var(--color-border-tertiary)',
    fontSize:      14,
    background:    'var(--color-background-primary)',
    color:         'var(--color-text-primary)',
    outline:       'none',
    fontFamily:    'var(--font-sans)',
    boxSizing:     'border-box' as const,
  };

  return (
    <main
      aria-label="نموذج تسجيل الدخول إلى منصة مهاري"
      style={{
        width:        '100%',
        maxWidth:     400,
        background:   'var(--color-background-primary)',
        border:       '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-xl)',
        padding:      '2rem',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, color: 'var(--teal)', letterSpacing: '-0.02em' }}>
          مهاري
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6 }}>
          منصة اكتشاف القدرات والتمكين المهاري
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="email"
            style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}
          >
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            dir="ltr"
            placeholder="example@school.edu.sa"
            style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="password"
            style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}
          >
            كلمة المرور
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            dir="ltr"
            style={{ ...inputStyle, direction: 'ltr' }}
          />
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              padding:       '10px 12px',
              borderRadius:  'var(--border-radius-md)',
              background:    'var(--color-background-danger)',
              color:         'var(--color-text-danger)',
              fontSize:      13,
              marginBottom:  '1rem',
              borderInlineStart: '2px solid var(--color-text-danger)',
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          style={{
            width:         '100%',
            padding:       '11px',
            borderRadius:  'var(--border-radius-md)',
            border:        'none',
            background:    loading ? 'var(--color-border-tertiary)' : 'var(--teal)',
            color:         '#FFFFFF',
            fontSize:      14,
            fontWeight:    500,
            cursor:        loading ? 'not-allowed' : 'pointer',
            fontFamily:    'var(--font-sans)',
            transition:    'background 0.15s',
          }}
        >
          {loading ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
        </button>
      </form>

      <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: '1.5rem', lineHeight: 1.6 }}>
        يُمنح الوصول من قِبل مدير المنصة.
        <br />
        هذه المنصة حصرية للمشرفين والمعلمين وأولياء الأمور المعتمدين.
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ width: 400, padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
        جارٍ التحميل…
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
