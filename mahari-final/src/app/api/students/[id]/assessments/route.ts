import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const AssessmentSchema = z.object({
  domainId:        z.string().uuid(),
  maturityLevel:   z.number().int().min(1).max(4),
  observationNote: z.string().min(30, 'Observation note must be at least 30 characters'),
  assessmentType:  z.enum(['formal', 'informal', 'observation']).optional().default('formal'),
});

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const { data, error } = await supabase
    .from('skill_assessments')
    .select('*, skill_domains(id, name_en, name_ar, color_hex, display_order)')
    .eq('student_id', params.id)
    .order('assessed_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const role = user.app_metadata?.role as string;
  if (!['supervisor', 'teacher', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = AssessmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 422 });
  }

  const { domainId, maturityLevel, observationNote, assessmentType } = parsed.data;

  const { data, error } = await supabase
    .from('skill_assessments')
    .insert({
      student_id:       params.id,
      domain_id:        domainId,
      assessor_id:      user.id,
      school_id:        user.app_metadata?.school_id,
      maturity_level:   maturityLevel as 1 | 2 | 3 | 4,
      observation_note: observationNote,
      assessment_type:  assessmentType,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch domain name for the AI insight trigger
  const { data: domain } = await supabase.from('skill_domains').select('name_en').eq('id', domainId).single();

  return NextResponse.json({
    success:      true,
    data:         { id: data.id },
    domainNameEn: domain?.name_en ?? '',
  }, { status: 201 });
}
