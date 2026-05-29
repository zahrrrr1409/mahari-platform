import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const PlanSchema = z.object({
  domainId:          z.string().uuid(),
  targetDescription: z.string().min(20),
  targetDate:        z.string().optional(),
  activities:        z.array(z.object({ id: z.string(), description: z.string(), completed: z.boolean() })).optional().default([]),
});

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  const { data, error } = await supabase
    .from('skill_plans')
    .select('*, skill_domains(id, name_en, name_ar, color_hex)')
    .eq('student_id', params.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

  if (!['supervisor', 'admin'].includes(user.app_metadata?.role ?? '')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = PlanSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 422 });

  const { data, error } = await supabase
    .from('skill_plans')
    .insert({
      student_id:         params.id,
      domain_id:          parsed.data.domainId,
      created_by:         user.id,
      school_id:          user.app_metadata?.school_id,
      target_description: parsed.data.targetDescription,
      target_date:        parsed.data.targetDate ?? null,
      activities:         parsed.data.activities,
    })
    .select('*, skill_domains(id, name_en, name_ar, color_hex)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data }, { status: 201 });
}
