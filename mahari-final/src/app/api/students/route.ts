import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const CreateSchema = z.object({
  nameAr:      z.string().min(2).max(255),
  nameEn:      z.string().max(255).optional(),
  gradeLevel:  z.string().max(50).optional(),
  programType: z.string().max(100).optional(),
  // ENFORCE: diagnosis fields are rejected
}).refine(
  data => !Object.keys(data).some(k => ['diagnosis','disability','condition','icd','dsm'].some(f => k.toLowerCase().includes(f))),
  { message: 'Diagnosis fields are not permitted in student records.' }
);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const { data, error } = await supabase
    .from('students')
    .select('*, skill_profiles(profile_strength, ability_signature)')
    .is('deleted_at', null)
    .order('name_ar', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const role = user.app_metadata?.role as string;
  if (!['supervisor', 'admin'].includes(role)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 422 });

  const { nameAr, nameEn, gradeLevel, programType } = parsed.data;
  const { data, error } = await supabase
    .from('students')
    .insert({ name_ar: nameAr, name_en: nameEn ?? null, grade_level: gradeLevel ?? null, program_type: programType ?? null, school_id: user.app_metadata?.school_id })
    .select('id, name_ar')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-assign to creating supervisor
  if (role === 'supervisor') {
    await supabase.from('supervisor_assignments').insert({ supervisor_id: user.id, student_id: data.id, school_id: user.app_metadata?.school_id });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
