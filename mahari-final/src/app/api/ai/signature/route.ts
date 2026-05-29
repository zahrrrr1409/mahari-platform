import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { callClaudeForCapability } from '@/lib/ai/client';
import { buildAiPayload } from '@/lib/ai/anonymize';

// Claude API can take 15–30s. Default Vercel timeout is 10s (Hobby) / 60s (Pro).
// Set to 60s — requires Vercel Pro plan. On Hobby, reduce AI complexity if needed.
export const maxDuration = 60;

const RequestSchema = z.object({
  studentId: z.string().uuid(),
});

/**
 * POST /api/ai/signature
 *
 * Triggers ability signature generation for a student.
 * Requires: authenticated supervisor with the student in their caseload.
 *
 * Flow:
 * 1. Verify auth + role
 * 2. Fetch student assessments (RLS ensures caseload access only)
 * 3. Build anonymized payload (no PII leaves the server)
 * 4. Call Claude API
 * 5. Store draft in skill_profiles.sig_draft (NOT live yet)
 * 6. Create ai_recommendations record (pending review)
 * 7. Return { success, confidence, lowConfidenceFlag }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // ─── Auth ──────────────────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_REQUIRED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const role = user.app_metadata?.role as string | undefined;
  if (!['supervisor', 'admin'].includes(role ?? '')) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Only supervisors can generate ability signatures' } },
      { status: 403 }
    );
  }

  // ─── Validate request ──────────────────────────────────────────
  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'studentId is required' } },
      { status: 422 }
    );
  }
  const { studentId } = parsed.data;

  // ─── Fetch student data (RLS enforces caseload access) ─────────
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, name_ar, name_en, school_id')
    .eq('id', studentId)
    .single();

  if (studentError || !student) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Student not found or not in your caseload' } },
      { status: 404 }
    );
  }

  // ─── Fetch assessments with domain info ────────────────────────
  const { data: assessments } = await supabase
    .from('skill_assessments')
    .select(`
      domain_id,
      maturity_level,
      assessed_at,
      skill_domains ( name_en, name_ar )
    `)
    .eq('student_id', studentId)
    .order('assessed_at', { ascending: true });

  if (!assessments || assessments.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'At least one assessment is required before generating an ability signature' } },
      { status: 422 }
    );
  }

  // ─── Fetch supervisor profile for sanitization ─────────────────
  const { data: supervisorProfile } = await supabase
    .from('profiles')
    .select('name_ar, name_en')
    .eq('id', user.id)
    .single();

  // ─── Build anonymized payload (no PII) ─────────────────────────
  const payload = buildAiPayload({
    studentId:      student.id,
    studentNameAr:  student.name_ar,
    studentNameEn:  student.name_en,
    assessments:    assessments as any,
    requestType:    'ability_signature',
    supervisorName: supervisorProfile?.name_ar ?? supervisorProfile?.name_en ?? null,
  });

  // ─── Call Claude API ───────────────────────────────────────────
  let aiResult;
  try {
    aiResult = await callClaudeForCapability(payload, assessments.length);
  } catch (err) {
    console.error('[AI signature] Claude API failed:', err);
    return NextResponse.json(
      { success: false, error: { code: 'AI_UNAVAILABLE', message: 'AI service temporarily unavailable. Please try again in a few minutes.' } },
      { status: 503 }
    );
  }

  // ─── Store draft (not live — supervisor must approve) ──────────
  await supabase
    .from('skill_profiles')
    .update({ sig_draft: aiResult.content })
    .eq('student_id', studentId);

  // ─── Create pending recommendation record ─────────────────────
  await supabase.from('ai_recommendations').insert({
    student_id:    studentId,
    school_id:     student.school_id,
    rec_type:      'capability_insight',
    content_draft: aiResult.content,
    confidence:    aiResult.confidence,
    review_status: 'pending',
  });

  return NextResponse.json({
    success:          true,
    confidence:       aiResult.confidence,
    lowConfidenceFlag: aiResult.lowConfidenceFlag,
    message:          'Ability signature draft generated. Please review it in the student profile before approving.',
  });
}
