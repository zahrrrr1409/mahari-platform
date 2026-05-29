'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Student, SkillProfile } from '@/lib/types/database';

export interface StudentWithProfile extends Student {
  skill_profiles: Pick<SkillProfile, 'profile_strength' | 'ability_signature'>[];
}

/**
 * Fetches the current supervisor's caseload with profile summaries.
 * RLS automatically restricts to assigned students only.
 */
export function useStudents() {
  const [students, setStudents] = useState<StudentWithProfile[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: err } = await supabase
      .from('students')
      .select(`
        *,
        skill_profiles (
          profile_strength,
          ability_signature
        )
      `)
      .is('deleted_at', null)
      .order('name_ar', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setStudents((data ?? []) as StudentWithProfile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);

  return { students, loading, error, refetch: fetch };
}

/**
 * Fetches a single student by ID with full profile and assessment data.
 */
export function useStudent(studentId: string) {
  const [student, setStudent] = useState<StudentWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const supabase = createClient();
    supabase
      .from('students')
      .select(`
        *,
        skill_profiles (*)
      `)
      .eq('id', studentId)
      .is('deleted_at', null)
      .single()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setStudent(data as StudentWithProfile);
        setLoading(false);
      });
  }, [studentId]);

  return { student, loading, error };
}
