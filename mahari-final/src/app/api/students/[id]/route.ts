import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const UpdateSchema = z.object({
  nameAr:      z.string().min(2).max(255).optional(),
  nameEn:      z.string().max(255).nullable().optional(),
  gradeLevel:  z.string().max(50).nullable().optional(),
  programType: z.string().max(100).nullable().optional(),
});

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const { data, error } = await supabase
    .from('students')
    .select('*, skill_profiles(*)')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (error || !data) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const role = user.app_metadata?.role as string;
  if (!['supervisor', 'admin'].includes(role)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 });

  const updates: Record<string, unknown> = {};
  if (parsed.data.nameAr      !== undefined) updates['name_ar']      = parsed.data.nameAr;
  if (parsed.data.nameEn      !== undefined) updates['name_en']      = parsed.data.nameEn;
  if (parsed.data.gradeLevel  !== undefined) updates['grade_level']  = parsed.data.gradeLevel;
  if (parsed.data.programType !== undefined) updates['program_type'] = parsed.data.programType;

  const { data, error } = await supabase.from('students').update(updates).eq('id', params.id).select('id, name_ar, name_en, grade_level, program_type').single();
  if (error || !data) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ success: true, data });
}
