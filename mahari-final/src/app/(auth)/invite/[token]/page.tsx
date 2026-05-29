'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Parent invite activation page.
 * Supabase sends the parent an email with a magic link.
 * The link lands here. Supabase auto-detects the token from the URL hash
 * and signs the user in via onAuthStateChange.
 * On SIGNED_IN, we redirect to /parent.
 *
 * useSearchParams() requires a Suspense boundary in Next.js 14.
 */
function InviteContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const [status, setStatus] = useState<'waiting' | 'success' | 'error'>('waiting');
  const [message, setMessage] = useState('جارٍ تفعيل حسابك…');

  useEffect(() => {
    const supabase = createClient();

    // Supabase's magic link puts the access_token in the URL hash.
    // The SSR package processes it automatically on the first getUser() call.
    // We just need to listen for the state change.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const role = session.user.app_metadata?.role as string | undefined;

          // Confirm this is a parent account
          if (role !== 'parent') {
            setStatus('error');
            setMessage('هذا الرابط لحسابات أولياء الأمور فقط.');
            return;
          }

          setStatus('success');
          setMessage('تم تفعيل حسابك بنجاح! جارٍ التحويل…');
          setTimeout(() => router.push('/parent'), 1200);
        }

        if (event === 'TOKEN_REFRESHED') {
          // Already logged in, redirect directly
          router.push('/parent');
        }
      }
    );

    // Handle error param from Supabase (e.g. expired link)
    const errorCode = params.get('error_code');
    const errorDesc = params.get('error_description');
    if (errorCode) {
      setStatus('error');
      setMessage(
        errorCode === 'otp_expired'
          ? 'انتهت صلاحية رابط الدعوة. يرجى طلب رابط جديد من المشرف.'
          : errorDesc ?? 'حدث خطأ في التفعيل.'
      );
    }

    return () => subscription.unsubscribe();
  }, [router, params]);

  return (
    <div style={{
      background:   'var(--color-background-primary)',
      border:       '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-xl)',
      padding:      '2.5rem 2rem',
      width:        '100%',
      maxWidth:     400,
      textAlign:    'center',
    }}>
      <div style={{ fontSize: 24, fontWeight: 500, color: 'var(--teal)', marginBottom: 16 }}>مهاري</div>

      {status === 'waiting' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {/* Simple CSS spinner */}
          <div style={{
            width:        36,
            height:       36,
            border:       '3px solid var(--color-border-tertiary)',
            borderTop:    '3px solid var(--teal)',
            borderRadius: '50%',
            animation:    'spin 1s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{message}</div>
        </div>
      )}

      {status === 'success' && (
        <div style={{ color: 'var(--color-text-success)', fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
          {message}
        </div>
      )}

      {status === 'error' && (
        <div>
          <div style={{
            padding:      '12px 16px',
            borderRadius: 'var(--border-radius-md)',
            background:   'var(--color-background-danger)',
            color:        'var(--color-text-danger)',
            fontSize:     13,
            marginBottom: 16,
          }}>
            {message}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            يرجى التواصل مع المشرف لإعادة إرسال رابط الدعوة.
          </p>
        </div>
      )}
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
        جارٍ التحقق من رابط الدعوة…
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
