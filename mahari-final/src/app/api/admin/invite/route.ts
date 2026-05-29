import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const Schema = z.object({
  parentEmail:  z.string().email().toLowerCase().trim(),
  parentNameAr: z.string().min(2).max(255).optional(),
  studentId:    z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const supabase      = await createClient();
  const supabaseAdmin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
  if (!['supervisor', 'admin'].includes(user.app_metadata?.role ?? '')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 422 });

  const { parentEmail, parentNameAr, studentId } = parsed.data;

  // Verify student is in supervisor's caseload
  const { data: assignment } = await supabase
    .from('supervisor_assignments')
    .select('student_id')
    .eq('supervisor_id', user.id)
    .eq('student_id', studentId)
    .eq('is_active', true)
    .single();

  if (!assignment) return NextResponse.json({ error: 'FORBIDDEN', message: 'Student not in your caseload' }, { status: 403 });

  // Invite parent via Supabase (sends email with magic link)
  const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(parentEmail, {
    data: {
      name_ar:    parentNameAr ?? 'ولي الأمر',
      role:       'parent',
      school_id:  user.app_metadata?.school_id,
    },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/parent`,
  });

  if (inviteErr) {
    console.error('[invite]', inviteErr);
    return NextResponse.json({ error: 'INVITE_FAILED', message: inviteErr.message }, { status: 500 });
  }

  // Set app_metadata for RBAC
  await supabaseAdmin.auth.admin.updateUserById(invited.user.id, {
    app_metadata: { role: 'parent', school_id: user.app_metadata?.school_id },
  });

  // Create/update the parent_student_link
  await supabase.from('parent_student_links').upsert({
    parent_id:  invited.user.id,
    student_id: studentId,
    school_id:  user.app_metadata?.school_id,
  }, { onConflict: 'parent_id,student_id' });

  return NextResponse.json({ success: true, message: 'Invitation sent. Parent will receive an email.' }, { status: 201 });
}
