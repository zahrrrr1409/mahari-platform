'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SessionUser } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

/**
 * Returns the current authenticated user with role and schoolId.
 * Uses Supabase's client-side session — refreshes automatically.
 *
 * @example
 * const { user, loading } = useUser();
 * if (!user) return null;
 * console.log(user.role);  // 'supervisor'
 */
export function useUser() {
  const [user,    setUser]    = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user: raw } }) => {
      setUser(raw ? toSessionUser(raw) : null);
      setLoading(false);
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ? toSessionUser(session.user) : null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

function toSessionUser(raw: User): SessionUser {
  return {
    id:       raw.id,
    email:    raw.email ?? null,
    role:     raw.app_metadata?.role ?? 'teacher',
    schoolId: raw.app_metadata?.school_id ?? null,
    nameAr:   raw.user_metadata?.name_ar ?? raw.email ?? 'مستخدم',
    nameEn:   raw.user_metadata?.name_en ?? null,
  };
}
