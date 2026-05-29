'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  href:        string;
  labelAr:     string;
  labelEn:     string;
  icon:        string;
  badgeKey?:   string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',              labelAr: 'لوحة المتابعة', labelEn: 'Dashboard', icon: 'ti-layout-dashboard' },
  { href: '/dashboard/students',     labelAr: 'الطلاب',       labelEn: 'Students',  icon: 'ti-users' },
  { href: '/dashboard/review',       labelAr: 'مراجعة الذكاء الاصطناعي', labelEn: 'AI Reviews', icon: 'ti-brain', badgeKey: 'aiReviews' },
];

interface SidebarProps {
  pendingAiCount?: number;
}

export function Sidebar({ pendingAiCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user }  = useUser();

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(href);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside
      aria-label="قائمة التنقل الرئيسية"
      style={{
        width:         210,
        minHeight:     '100vh',
        background:    'var(--color-background-primary)',
        borderInlineEnd: '0.5px solid var(--color-border-tertiary)',
        display:       'flex',
        flexDirection: 'column',
        flexShrink:    0,
        position:      'sticky',
        top:           0,
        height:        '100vh',
        overflowY:     'auto',
      }}
    >
      {/* Brand */}
      <div style={{
        padding:       '18px 16px 14px',
        borderBottom:  '0.5px solid var(--color-border-tertiary)',
      }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--teal)', letterSpacing: '-0.02em' }}>
            مهاري
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2, letterSpacing: '0.04em' }}>
            MAHARI PLATFORM v0.1
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '12px 10px', flex: 1 }} aria-label="التنقل">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            9,
                padding:        '9px 10px',
                borderRadius:   'var(--border-radius-md)',
                textDecoration: 'none',
                fontSize:       13,
                fontWeight:     active ? 500 : 400,
                color:          active ? 'var(--teal)' : 'var(--color-text-secondary)',
                background:     active ? 'var(--teal-light)' : 'transparent',
                marginBottom:   2,
                transition:     'all 0.15s',
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
              <span style={{ flex: 1 }}>{item.labelAr}</span>
              {item.badgeKey === 'aiReviews' && pendingAiCount > 0 && (
                <span
                  aria-label={`${pendingAiCount} توصية تنتظر المراجعة`}
                  style={{
                    background:   'var(--color-background-danger)',
                    color:        'var(--color-text-danger)',
                    fontSize:     10,
                    fontWeight:   600,
                    padding:      '1px 6px',
                    borderRadius: 100,
                    minWidth:     18,
                    textAlign:    'center',
                  }}
                >
                  {pendingAiCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {user && (
        <div style={{
          padding:      '14px 16px',
          borderTop:    '0.5px solid var(--color-border-tertiary)',
        }}>
          <div style={{
            width:          32, height:          32,
            borderRadius:   '50%',
            background:     'var(--amber-light)',
            display:        'flex', alignItems: 'center', justifyContent: 'center',
            fontSize:       13, fontWeight: 500, color: 'var(--amber)',
            marginBottom:   8,
          }}>
            {user.nameAr.charAt(0)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {user.nameAr}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1, marginBottom: 10 }}>
            {
              user.role === 'supervisor' ? 'مشرف مهاري' :
              user.role === 'teacher'    ? 'معلم'         :
              user.role === 'principal'  ? 'قائد المدرسة' :
              user.role
            }
          </div>
          <button
            onClick={handleLogout}
            style={{
              display:        'flex',
              alignItems:     'center',
              gap:            6,
              width:          '100%',
              padding:        '7px 8px',
              borderRadius:   'var(--border-radius-md)',
              border:         '0.5px solid var(--color-border-tertiary)',
              background:     'none',
              color:          'var(--color-text-tertiary)',
              fontSize:       12,
              cursor:         'pointer',
              fontFamily:     'var(--font-sans)',
              transition:     'all 0.15s',
            }}
            aria-label="تسجيل الخروج"
          >
            <i className="ti ti-logout" style={{ fontSize: 14 }} aria-hidden="true" />
            تسجيل الخروج
          </button>
        </div>
      )}
    </aside>
  );
}
