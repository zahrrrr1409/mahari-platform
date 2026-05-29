import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { callClaudeForCapability } from '@/lib/ai/client';
import { buildAiPayload } from '@/lib/ai/anonymize';

// Claude API can take 15–30s. Vercel Pro required for 60s timeout.
export const maxDuration = 60;

const RequestSchema = z.object({
  studentId:       z.string().uuid(),
  assessmentId:    z.string().uuid().optional(),   // optional: omitted on preview calls
  domainNameEn:    z.string().min(1),
  maturityLevel:   z.number().int().min(1).max(4),
  observationNote: z.string().min(30),
});

/**
 * POST /api/ai/insight
 *
 * Generates a capability insight after a new assessment is recorded.
 * Called automatically by the assessment form after saving an assessment.
 *
 * The insight enters the ai_recommendations table as 'pending' —
 * it is NOT shown to students or parents until supervisor approves.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } }, { status: 401 });
  }

  const role = user.app_metadata?.role as string | undefined;
  if (!['supervisor', 'teacher', 'admin'].includes(role ?? '')) {
    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request' } }, { status: 422 });
  }

  const { studentId, assessmentId, domainNameEn, maturityLevel, observationNote } = parsed.data;

  // Fetch student + full assessment history (RLS enforces access)
  const { data: student } = await supabase
    .from('students')
    .select('id, name_ar, name_en, school_id')
    .eq('id', studentId)
    .single();

  if (!student) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Student not found' } }, { status: 404 });
  }

  const { data: assessments } = await supabase
    .from('skill_assessments')
    .select('domain_id, maturity_level, assessed_at, skill_domains(name_en, name_ar)')
    .eq('student_id', studentId)
    .order('assessed_at', { ascending: true });

  const { data: supervisorProfile } = await supabase
    .from('profiles')
    .select('name_ar, name_en')
    .eq('id', user.id)
    .single();

  const payload = buildAiPayload({
    studentId:     student.id,
    studentNameAr: student.name_ar,
    studentNameEn: student.name_en,
    assessments:   (assessments ?? []) as any,
    requestType:   'capability_insight',
    newObservation: {
      domainNameEn,
      level: maturityLevel,
      text:  observationNote,
    },
    supervisorName: supervisorProfile?.name_ar ?? supervisorProfile?.name_en ?? null,
  });

  let aiResult;
  try {
    aiResult = await callClaudeForCapability(payload, (assessments ?? []).length);
  } catch (err) {
    console.error('[AI insight] Claude API failed:', err);
    // Non-blocking — the assessment was already saved. Just skip the AI insight.
    return NextResponse.json({ success: true, skipped: true, reason: 'AI_UNAVAILABLE' });
  }

  await supabase.from('ai_recommendations').insert({
    student_id:    studentId,
    school_id:     student.school_id,
    triggered_by:  assessmentId ?? null,
    rec_type:      'capability_insight',
    content_draft: aiResult.content,
    confidence:    aiResult.confidence,
    review_status: 'pending',
  });

  return NextResponse.json({
    success:           true,
    insight:           aiResult.content,      // used by AssessmentStepper preview
    confidence:        aiResult.confidence,
    lowConfidenceFlag: aiResult.lowConfidenceFlag,
  });
}
