import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

/**
 * Privileged Supabase client using the service_role key.
 *
 * SECURITY RULES:
 * 1. ONLY import this in Next.js API routes (Route Handlers).
 * 2. NEVER import this in Client Components or Server Components.
 * 3. NEVER expose this to the browser.
 * 4. This client BYPASSES Row-Level Security.
 *
 * Use cases in Mahari:
 * - Creating user accounts with role + school_id in app_metadata
 * - Generating parent invite links
 * - Reading clinical_context (audited procedure only)
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'These must be set in server environment only.'
    );
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken:  false,
      persistSession:    false,
    },
  });
}
