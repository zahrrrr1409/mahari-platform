'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SkillAssessment, SkillDomain } from '@/lib/types/database';

export interface AssessmentWithDomain extends SkillAssessment {
  skill_domains: Pick<SkillDomain, 'name_en' | 'name_ar' | 'color_hex' | 'display_order'>;
}

/**
 * Fetches the full assessment history for a student.
 * Returns assessments ordered by assessed_at DESC (newest first).
 */
export function useAssessments(studentId: string) {
  const [assessments, setAssessments] = useState<AssessmentWithDomain[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!studentId) return;
    const supabase = createClient();

    const { data, error: err } = await supabase
      .from('skill_assessments')
      .select('*, skill_domains(*)')
      .eq('student_id', studentId)
      .order('assessed_at', { ascending: false });

    if (err) setError(err.message);
    else setAssessments((data ?? []) as AssessmentWithDomain[]);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { void fetch(); }, [fetch]);

  return { assessments, loading, error, refetch: fetch };
}

/** Returns the latest maturity level per domain for a student (for the radar chart). */
export function useCurrentDomainLevels(studentId: string) {
  const { assessments, loading } = useAssessments(studentId);

  const levels = new Map<string, { level: number; domainNameEn: string; domainNameAr: string; colorHex: string }>();

  for (const a of [...assessments].reverse()) {
    // Since assessments are newest-first, reversing gives oldest-first;
    // later iterations overwrite with newer values
    levels.set(a.domain_id, {
      level:        a.maturity_level,
      domainNameEn: a.skill_domains.name_en,
      domainNameAr: a.skill_domains.name_ar,
      colorHex:     a.skill_domains.color_hex ?? '#9B9890',
    });
  }

  return { levels: Object.fromEntries(levels), loading };
}

interface SubmitAssessmentPayload {
  studentId:       string;
  domainId:        string;
  domainNameEn:    string;
  maturityLevel:   number;
  observationNote: string;
  schoolId:        string;
}

/**
 * Submits a new skill assessment.
 * After saving, triggers async AI insight generation.
 */
export async function submitAssessment(payload: SubmitAssessmentPayload): Promise<{
  assessmentId: string | null;
  error: string | null;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { assessmentId: null, error: 'Not authenticated' };

  // 1. Save assessment
  const { data: assessment, error: insertError } = await supabase
    .from('skill_assessments')
    .insert({
      student_id:       payload.studentId,
      domain_id:        payload.domainId,
      assessor_id:      user.id,
      school_id:        payload.schoolId,
      maturity_level:   payload.maturityLevel as 1 | 2 | 3 | 4,
      observation_note: payload.observationNote,
      assessment_type:  'formal',
    })
    .select('id')
    .single();

  if (insertError) return { assessmentId: null, error: insertError.message };

  // 2. Trigger AI insight (fire-and-forget — don't block the user)
  void fetch('/api/ai/insight', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId:       payload.studentId,
      assessmentId:    assessment.id,
      domainNameEn:    payload.domainNameEn,
      maturityLevel:   payload.maturityLevel,
      observationNote: payload.observationNote,
    }),
  });

  return { assessmentId: assessment.id, error: null };
}
