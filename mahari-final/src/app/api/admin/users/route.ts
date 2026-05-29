import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/lib/types/database';

const CreateUserSchema = z.object({
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(200).optional(),  // optional for invite flow
  nameAr:   z.string().min(2).max(255),
  nameEn:   z.string().max(255).optional(),
  role:     z.enum(['student','teacher','supervisor','parent','principal','admin']),
  schoolId: z.string().uuid().optional(),
});

/**
 * POST /api/admin/users
 *
 * Creates a new user with app_metadata set server-side (service_role).
 * Only admin users can call this endpoint.
 *
 * app_metadata.role and app_metadata.school_id are set here —
 * they are unmodifiable by the user and power all RLS policies.
 *
 * For parent accounts, use POST /api/admin/invite-parent instead,
 * which sends a Supabase invite email.
 */
export async function POST(request: NextRequest) {
  const supabase      = await createClient();
  const supabaseAdmin = createAdminClient();

  // ─── Auth check: only admins ───────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;

  if (!user || role !== 'admin') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid user data' } },
      { status: 422 }
    );
  }

  const { email, password, nameAr, nameEn, role: newRole, schoolId } = parsed.data;

  // ─── Create user via service_role ─────────────────────────────
  const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password:  password ?? generateTemporaryPassword(),
    email_confirm: true,
    // app_metadata: set by admin, not modifiable by user — powers RLS
    app_metadata: {
      role:      newRole,
      school_id: schoolId ?? null,
    },
    // user_metadata: human-readable, visible to user
    user_metadata: {
      name_ar:   nameAr,
      name_en:   nameEn ?? null,
      role:      newRole,
      school_id: schoolId ?? null,
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'A user with this email already exists' } },
        { status: 409 }
      );
    }
    console.error('[Admin users] Create user failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: 'Failed to create user' } },
      { status: 500 }
    );
  }

  // The handle_new_auth_user trigger will auto-create the profiles row.

  return NextResponse.json({
    success: true,
    data: {
      id:    newUser.user.id,
      email: newUser.user.email,
      role:  newRole,
    },
  }, { status: 201 });
}

function generateTemporaryPassword(): string {
  // Random 16-char password — user must reset via invite flow
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase() + '!1';
}
