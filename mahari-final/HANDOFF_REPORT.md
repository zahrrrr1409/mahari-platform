# Mahari v0.1 — Developer Handoff Report
### Readiness Assessment Before Deployment

> **Verdict:** NOT ready for production deployment without bug fixes.
> Suitable for local development and staging with known workarounds.
> Estimated fix time for blocking bugs: **4–6 hours**.

---

## 1. What Is Fully Completed

The following are production-ready and require no changes.

### Database Layer ✅
- All 6 SQL migrations — schema, auth triggers, RLS, triggers, indexes, seed data
- `profiles` table correctly extends `auth.users` (no password/email stored)
- Row-Level Security with 20+ policies using `auth.uid()` and `auth.jwt()` — compatible with Supabase PgBouncer
- Profile strength auto-recalculation trigger (`DISTINCT ON` latest per domain)
- Ability signature version archiving trigger
- Student auto-profile creation trigger on INSERT
- All 6 skill domains seeded
- Indexes on all hot query paths

### Infrastructure ✅
- `src/middleware.ts` — correct Supabase SSR session refresh + route protection
- `src/lib/supabase/client.ts` — browser client with Database types
- `src/lib/supabase/server.ts` — server client with async `cookies()`
- `src/lib/supabase/admin.ts` — service_role client with correct guards
- `src/lib/types/database.ts` — hand-authored Supabase types (accurate to schema)
- `src/lib/types/index.ts` — application-level types
- `src/lib/utils/maturity.ts` — maturity level definitions and `calcProfileStrength()`
- `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- `vercel.json`, `.env.local.example`, `.gitignore`, `README.md`

### AI Layer ✅
- `src/lib/ai/anonymize.ts` — full PII stripping (names, NID patterns)
- `src/lib/ai/prompts.ts` — governed system prompt (ability-first, no diagnosis)
- `src/lib/ai/client.ts` — Claude API client with retry logic and response parsing
- `POST /api/ai/signature` — full flow: auth check → fetch → anonymize → Claude → store draft
- `POST /api/admin/users` — service_role user creation with `app_metadata` RBAC

### Authentication ✅
- Login page with correct Supabase `signInWithPassword`
- Role-based redirect on login (`parent` → `/parent`, `principal` → `/school`, else `/dashboard`)
- Auth layouts (centered auth pages)

### Pages and Components ✅
- Supervisor layout with working Sidebar (active state, pending AI badge)
- `AbilitySignature.tsx` — approved, draft, and empty states
- `CapabilityRadar.tsx` — Recharts radar with correct `'use client'`
- `DomainCard.tsx` — maturity bar + badge
- `MaturityBar.tsx` — 4-segment progress bar
- `RecommendationCard.tsx` — approve / modify / reject with Supabase update
- `StatCard.tsx` — metric display
- Supervisor dashboard page (real Supabase data, no mocks)
- Student list page (real data)
- New student form (with forbidden field rejection logic)
- Observation log page (read + write)
- Skill plans page + `PlansList` client component
- AI review queue page + `ReviewQueueClient`
- Principal school analytics page
- Parent home page (list of children)
- Parent child profile page (simplified view)
- Parent observation form

---

## 2. What Is Partially Completed

These files exist and have the right structure but contain specific gaps.

### `POST /api/ai/insight` — Partial ⚠️
The route correctly calls Claude, stores the recommendation, and handles errors. **Gap:** The response body is `{ success, confidence, lowConfidenceFlag }` — it does NOT include an `insight` field. The `AssessmentStepper` component checks `data.insight` for the preview, so the preview will never render. The assessment saves correctly; only the in-form preview is broken.

### `src/hooks/useAssessments.ts` — Partial ⚠️
`submitAssessment()` is correct for saving to the database. **Gap:** The fire-and-forget AI call passes `assessmentId: assessment.id` correctly — this is fine. However the preview call in `AssessmentStepper` (before the assessment is saved) passes `assessmentId: 'preview'` which is not a UUID. This call will be rejected by the API's Zod UUID validation and silently ignored, which is acceptable behavior but means the preview never shows.

### `src/lib/utils/domains.ts` — Partial ⚠️
Domain definitions are accurate for display (name, color, icon). **Gap:** The `id` fields are descriptive strings (`'daily-life'`, `'communication'`) — they are NOT database UUIDs. Any code that tries to match `domain.id` from this utility against a database `domain_id` will fail silently. Currently used only for display constants, which is correct. **Do not use the `id` field for database lookups.**

### `src/app/(auth)/invite/[token]/page.tsx` — Partial ⚠️
The UI is complete. **Gap:** It POSTs to `/api/auth/activate/:token` which does not exist in the codebase. The route needs to be created, or the page needs to be rewritten to use Supabase's built-in invite flow (the token in the URL from Supabase is a different format than what this page expects).

---

## 3. What Is Placeholder, Mock, or Broken

These items will cause errors in the current state.

### 🔴 BUG 1 — Broken import in student profile page
**File:** `src/app/(supervisor)/students/[id]/page.tsx`
**Lines 165–166:** `import SignatureGenerateButtonImpl` and `const SignatureGenerateButton` appear **after** the component function body that uses `<SignatureGenerateButton>`. `const` declarations are not hoisted. This is a JavaScript ReferenceError / TypeScript compile error.

**Fix:** Move the import to the top of the file:
```ts
// Move to top of file, line 1:
import SignatureGenerateButton from './_components/SignatureGenerateButton';
// Remove lines 165–166 entirely
```

### 🔴 BUG 2 — `assessmentId: 'preview'` is not a valid UUID
**File:** `src/components/assessments/AssessmentStepper.tsx`, line 78
When the user clicks "Generate AI Insight" in Step 4 before saving, the body includes `assessmentId: 'preview'`. The API route validates `assessmentId` with `z.string().uuid()` and will return 422, so the preview silently fails.

**Fix:** Either remove `assessmentId` from the preview call, or make the field optional in the API schema:
```ts
// In route.ts:
assessmentId: z.string().uuid().optional(),
// In Stepper:
assessmentId: undefined, // remove the preview field
```

### 🔴 BUG 3 — `/api/auth/activate/:token` route does not exist
**File:** `src/app/(auth)/invite/[token]/page.tsx`, line 23
The invite activation page POSTs to a non-existent route. Parent invite activation will fail with a 404.

**Fix option A** (simpler): Use Supabase's built-in invite flow. When Supabase sends an invite email, the magic link redirects to your app with a session token. The invite page should call `supabase.auth.exchangeCodeForSession(token)` or let Supabase handle the redirect automatically.

**Fix option B** (keep custom flow): Create `src/app/api/auth/activate/[token]/route.ts` that finds the `parent_student_links` record by token, activates the Supabase user via admin API, and marks the link as activated.

### 🔴 BUG 4 — AI preview field name mismatch
**File:** `src/components/assessments/AssessmentStepper.tsx`, line 86
Checks `data.insight` but `/api/ai/insight` returns `{ success, confidence, lowConfidenceFlag }` — no `insight` field. The preview will never show.

**Fix:**
```ts
// In route.ts, add the content to the response:
return NextResponse.json({ success: true, insight: aiResult.content, confidence: aiResult.confidence, ... });
```

### 🟡 DEAD IMPORT
**File:** `src/components/students/StudentCard.tsx`, line 2
`import { DOMAINS } from '@/lib/utils/domains'` — imported but never used. Causes a TypeScript warning and unnecessary bundle inclusion.

**Fix:** Remove the import.

### 🟡 MISSING: UI component library
`src/components/ui/` was planned (Button, Badge, LoadingSpinner) but never created. Pages that might need these import them nowhere currently — no compile errors, but the planned design system layer is absent.

### 🟡 MISSING: AppHeader component
`src/components/layout/AppHeader.tsx` was planned but never created. The supervisor layout uses only the Sidebar. If a header is needed, it must be built.

### 🟡 MISSING: PDF export route
`src/app/api/students/[id]/export/route.ts` is referenced in the README but never created. The "Download PDF" link in the student profile page does not exist.

### 🟡 `next.config.ts` — blocks Server Actions in production
Line 6: `serverActions: { allowedOrigins: ['localhost:3000'] }`
Server Actions from your Vercel domain will be blocked.

**Fix:** Add your production domain:
```ts
serverActions: { allowedOrigins: ['localhost:3000', 'your-app.vercel.app'] },
```

---

## 4. Supabase Configuration Required

Complete these steps in order before the app can run.

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
   - Select **Middle East (Bahrain)** region for NCA compliance
   - Note your Project Reference ID

2. **Get API keys** from Project Settings → API:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role/secret` key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Disable public signups** (users are created by admins only):
   - Authentication → Settings → Disable "Enable new user signups"

4. **Configure email templates** (Authentication → Email Templates):
   - Invite user template: customize with Mahari branding and Arabic text
   - The default template links to `{{ .ConfirmationURL }}` — ensure your site URL is set correctly

5. **Set redirect URLs** (Authentication → URL Configuration):
   - Site URL: `http://localhost:3000` (development) or `https://your-app.vercel.app`
   - Redirect URLs: add `http://localhost:3000/**` and `https://your-app.vercel.app/**`

6. **Run all migrations** (see Section 8)

7. **Create the first admin user manually** (see Section 9)

---

## 5. Vercel Configuration Required

1. **Connect repository** at [vercel.com](https://vercel.com) → New Project → Import Git repo

2. **Set environment variables** in Vercel Dashboard → Project → Settings → Environment Variables:
   - Set for **Production**, **Preview**, and **Development** environments as appropriate
   - `SUPABASE_SERVICE_ROLE_KEY` — mark as **Secret**, Production only

3. **Framework preset:** Next.js (auto-detected)

4. **Region:** Select `bah1` (Bahrain) or closest to Supabase region

5. **Update `next.config.ts`** before deploying (see Bug 4 above)

6. **After first deploy:** Add `https://your-app.vercel.app` to Supabase redirect URLs

---

## 6. Exact Environment Variables

```bash
# ── Public (safe to expose in browser) ──────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...                          # anon key from Supabase
NEXT_PUBLIC_APP_URL=http://localhost:3000                       # change to production URL on Vercel
NEXT_PUBLIC_APP_VERSION=0.1.0

# ── Server-only (NEVER expose to browser, NEVER commit) ─────────────
SUPABASE_SERVICE_ROLE_KEY=eyJh...                               # service_role key — bypasses RLS
ANTHROPIC_API_KEY=sk-ant-api03-...                              # Claude API key

# ── AI governance ────────────────────────────────────────────────────
ANTHROPIC_MODEL=claude-sonnet-4-6
AI_CONFIDENCE_THRESHOLD=0.60
AI_MAX_RETRIES=3
```

**Where to find each:**
- Supabase URL and keys: Supabase Dashboard → Project Settings → API
- Anthropic key: [console.anthropic.com](https://console.anthropic.com) → API Keys

---

## 7. Exact Local Run Commands

```bash
# Prerequisites: Node.js 20+, npm 10+, Supabase CLI

# 1. Install Supabase CLI
npm install -g supabase

# 2. Clone and install dependencies
git clone <your-repo-url>
cd mahari-final
npm install

# 3. Environment setup
cp .env.local.example .env.local
# Edit .env.local with your actual keys (see Section 6)

# 4. Run database migrations (see Section 8 for details)
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# 5. Start development server
npm run dev

# 6. Open browser
open http://localhost:3000

# Other useful commands:
npm run build        # Verify no TypeScript/build errors before deploy
npm run typecheck    # TypeScript check without building
npm run db:types     # Regenerate database.ts from live Supabase schema (run after any schema changes)
```

---

## 8. Exact Supabase Migration Steps

```bash
# Link your local project to Supabase
supabase link --project-ref YOUR_PROJECT_REF_ID
# You will be prompted for your database password

# Verify migrations are detected
supabase migration list
# Should show 6 pending migrations

# Push all migrations
supabase db push
# This executes:
# 20240101000001_schema.sql   — all tables
# 20240101000002_auth.sql     — auth trigger + JWT helpers
# 20240101000003_rls.sql      — all RLS policies
# 20240101000004_triggers.sql — profile strength + archiving
# 20240101000005_indexes.sql  — performance indexes
# 20240101000006_seed.sql     — 6 skill domains

# Verify seed data
# In Supabase Dashboard → Table Editor → skill_domains
# You should see exactly 6 rows

# If migrations fail, check the error message and run individually:
supabase db execute --file supabase/migrations/20240101000001_schema.sql
# etc.
```

**If you change the schema later:**
```bash
# Create a new migration (never edit existing migration files)
supabase migration new your_change_description

# After schema changes, regenerate TypeScript types:
npm run db:types
```

---

## 9. Test Accounts and Seed Data

### Creating the first admin user

Supabase does not allow self-signup (it's disabled). Create the first admin via the API:

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.sa",
    "password": "TestPassword123!",
    "email_confirm": true,
    "app_metadata": { "role": "admin", "school_id": null },
    "user_metadata": { "name_ar": "مدير النظام", "name_en": "System Admin" }
  }'
```

### Creating a test school and supervisor

After logging in as admin, use the app's user creation API:

```bash
# Create a school first (direct Supabase insert as admin)
# In Supabase Dashboard → Table Editor → schools → Insert row:
# name_ar: "مدرسة النور"
# region: "الرياض"
# Note the UUID created — you'll need it as school_id

# Create a supervisor via POST /api/admin/users (logged in as admin):
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "supervisor@test.sa",
    "password": "TestPassword123!",
    "nameAr": "أ. منى السلمي",
    "role": "supervisor",
    "schoolId": "YOUR_SCHOOL_UUID"
  }'
```

### Minimal test data to verify the full flow

1. Admin creates: 1 school, 1 supervisor, 1 teacher, 1 parent
2. Supervisor logs in → creates 2 students
3. Supervisor records 3+ assessments per student
4. Verify profile strength updates after each
5. Generate AI signature → appears in review queue
6. Approve → appears on student profile
7. Supervisor invites parent → parent activates account
8. Parent logs in → sees simplified profile

**There is no automated seed script for test data.** Everything must be created through the app interface or direct Supabase API calls.

---

## 10. Known Technical Debt

Items that work now but will cause problems as the project grows.

1. **`src/lib/utils/domains.ts` ID mismatch** — Domain `id` fields are strings, not UUIDs. Any future code that tries to use `DOMAIN_BY_ID` to map to database records will produce silent failures. Requires: fetch domain UUIDs once on app load and store in a cache/context, or always match by `name_en`.

2. **No loading states on Server Component pages** — When Supabase is slow, pages block silently with no spinner or skeleton. Add React Suspense boundaries with skeleton fallbacks.

3. **No error boundaries** — Any unhandled error in a Server Component crashes the entire page. Add `error.tsx` files in each route group.

4. **No pagination** — Student lists, assessment history, and recommendation queues load all records. Will break at ~100+ records per supervisor.

5. **`useAssessments.ts` refetch pattern** — Calls `supabase` without memoizing the client instance. Should extract client creation outside the callback.

6. **`ui/` components never built** — Button, Badge, LoadingSpinner are referenced in the project plan but absent. Components use inline styles directly instead. This makes design-system updates painful.

7. **No optimistic updates** — Form submissions refresh the page via `router.refresh()`. Adds perceived latency. Should use optimistic UI for assessment saves and status updates.

8. **`AssessmentStepper` re-generates AI on every click** — No debounce or deduplication. A user can click "Generate AI Insight" multiple times, creating multiple pending records for the same assessment.

9. **`next.config.ts` allows only `localhost:3000` as a Server Action origin** — Must be updated before production deploy.

10. **`vercel.json` references secret names (`@mahari-supabase-url`)** — These Vercel secret aliases must be created in the Vercel dashboard. Currently the `vercel.json` env section is documentation, not automatic configuration.

11. **No database backup strategy documented** — Supabase provides daily backups on Pro plan. On free plan, backups must be configured manually or via `pg_dump`.

12. **Arabic text in PDF exports** — PDF route does not exist yet. Arabic text requires special font handling (`@react-pdf/renderer` with Arabic font registration). This is non-trivial.

---

## 11. Security Risks to Review Before Production

| Risk | Severity | Status | Action Required |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` exposed in client code | Critical | ✅ Not exposed — server-only | Verify with `grep -r "SERVICE_ROLE" src/app/(auth) src/app/(supervisor) src/app/(parent) src/components` — should return nothing |
| `ANTHROPIC_API_KEY` exposed in client code | Critical | ✅ Not exposed — API routes only | Same grep check |
| Missing rate limiting on `/api/ai/*` routes | High | ❌ No rate limiting | A single authenticated user can spam Claude calls. Add `@vercel/edge-rate-limit` or check call count before processing |
| No CSRF protection | Medium | ⚠️ Next.js default | Next.js 14 API routes do not add CSRF headers automatically. For state-changing routes, verify `Origin` header matches expected domain |
| XSS via unsanitized user content | Medium | ⚠️ Partial | JSX auto-escapes string interpolation in most cases, but any `dangerouslySetInnerHTML` usage (none currently) would be a vector. Audit before adding rich text |
| Parent invite token brute-force | Medium | ✅ Mitigated by Supabase | Supabase invite tokens are cryptographically random and time-limited |
| `clinical_context` — no audit logging at application layer | Medium | ⚠️ Schema-level only | The table exists but no application route touches it. Any future access code must log to `audit_logs` |
| Student names in AI payloads | Low | ✅ Anonymized | `anonymize.ts` strips names. Verify with integration test: log payload and confirm no names present |
| Public Supabase anon key | Low | ✅ Expected behavior | The anon key is intentionally public. RLS is the security layer. Verify all tables have RLS enabled |
| Supabase dashboard access | Medium | ❌ Unaddressed | Anyone with Supabase project access can bypass RLS via Dashboard. Restrict dashboard access to minimum required team members |

---

## 12. Files That Must Never Be Exposed Publicly

```
.env.local                           # All secrets — NEVER commit
.env                                 # Same
src/lib/supabase/admin.ts            # Imports SERVICE_ROLE_KEY — server-only
src/app/api/admin/users/route.ts     # Service role operations
src/app/api/admin/invite/route.ts    # Service role operations
src/app/api/ai/signature/route.ts    # Anthropic key usage
src/app/api/ai/insight/route.ts      # Anthropic key usage
```

**Verification commands:**
```bash
# Confirm no secrets in git history
git log --all --full-history -- .env.local

# Confirm .env.local is gitignored
git check-ignore -v .env.local  # should output: .gitignore:.env.local

# Confirm admin routes are not publicly accessible
# (They are — but protected by auth check at route level.
# This must be tested: unauthenticated request should return 401)
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","nameAr":"test","role":"admin"}'
# Expected: 401 AUTH_REQUIRED
```

---

## 13. Step-by-Step Deployment Checklist

Complete in this exact order. Do not skip steps.

### Phase A — Fix blocking bugs (do before anything else)

- [ ] **A1.** Fix `students/[id]/page.tsx` — move `SignatureGenerateButton` import to top of file
- [ ] **A2.** Fix `AssessmentStepper.tsx` — make `assessmentId` optional in preview call (or remove it)
- [ ] **A3.** Fix `next.config.ts` — add production domain to `serverActions.allowedOrigins`
- [ ] **A4.** Fix `POST /api/ai/insight` response — add `insight: aiResult.content` to the return body
- [ ] **A5.** Fix invite activation page — rewrite to use Supabase's built-in invite flow
- [ ] **A6.** Remove dead import in `StudentCard.tsx`
- [ ] **A7.** Run `npm run build` — confirm **zero TypeScript errors** before proceeding

### Phase B — Supabase setup

- [ ] **B1.** Create Supabase project in Bahrain region
- [ ] **B2.** Copy URL, anon key, service role key from Project Settings → API
- [ ] **B3.** Disable public signup in Authentication → Settings
- [ ] **B4.** Set Site URL and redirect URLs in Authentication → URL Configuration
- [ ] **B5.** Run `supabase link --project-ref YOUR_REF`
- [ ] **B6.** Run `supabase db push` — verify all 6 migrations succeed
- [ ] **B7.** Verify in Dashboard: `skill_domains` table has 6 rows
- [ ] **B8.** Verify in Dashboard: `profiles` table exists and has triggers attached to `auth.users`
- [ ] **B9.** Create first admin user (see Section 9)
- [ ] **B10.** Create first school record manually in Dashboard

### Phase C — Local verification

- [ ] **C1.** Copy `.env.local.example` to `.env.local`, fill all values
- [ ] **C2.** Run `npm run dev`
- [ ] **C3.** Visit `http://localhost:3000` — confirm redirect to `/login`
- [ ] **C4.** Log in as admin — confirm redirect to `/dashboard`
- [ ] **C5.** Create a supervisor user via `POST /api/admin/users`
- [ ] **C6.** Log in as supervisor — confirm dashboard loads with empty caseload
- [ ] **C7.** Create a student — confirm redirect to student profile
- [ ] **C8.** Record an assessment — confirm profile strength updates
- [ ] **C9.** Verify no `SignatureGenerateButton` error in browser console
- [ ] **C10.** Run `npm run build` — confirm zero errors

### Phase D — Vercel deployment

- [ ] **D1.** Push code to GitHub (ensure `.env.local` is NOT committed)
- [ ] **D2.** Import repository in Vercel → New Project
- [ ] **D3.** Add all environment variables in Vercel Dashboard
- [ ] **D4.** Add production URL to `next.config.ts` `serverActions.allowedOrigins`
- [ ] **D5.** Deploy → verify build succeeds
- [ ] **D6.** Add Vercel domain to Supabase redirect URLs
- [ ] **D7.** Test login on production URL

### Phase E — Post-deployment verification

- [ ] **E1.** Test full supervisor flow on production (create student → assess → AI review)
- [ ] **E2.** Verify `SUPABASE_SERVICE_ROLE_KEY` is NOT visible in browser Network tab
- [ ] **E3.** Verify `ANTHROPIC_API_KEY` is NOT visible in browser Network tab
- [ ] **E4.** Test unauthenticated request to `/api/admin/users` — should return 401
- [ ] **E5.** Test cross-school RLS: log in as Supervisor A, attempt to GET a student belonging to Supervisor B — should return empty or 404

---

## 14. What to Test First After Running the App

Test in this exact sequence. If any step fails, stop and fix before continuing.

```
1. Can you reach /login?
   ✓ Confirms: Next.js is running, middleware is working

2. Can admin log in?
   ✓ Confirms: Supabase auth, JWT, app_metadata RBAC

3. Does the dashboard load with no console errors?
   ✓ Confirms: Server Component data fetching, Supabase RLS, CSS variables

4. Create a student — does profile auto-create at 0%?
   ✓ Confirms: auto_create_skill_profile trigger works

5. Record one assessment — does profile strength update?
   ✓ Confirms: recalc_profile_strength trigger works

6. Record 6 assessments (one per domain) — does strength reach correct %?
   Test: levels [3,2,4,2,4,3] → should show exactly 75%
   ✓ Confirms: formula and trigger are correct

7. Click "Generate Ability Signature" — does the button respond?
   ✓ Confirms: AI API route auth, anonymization, Claude API key

8. Does the recommendation appear in /dashboard/review?
   ✓ Confirms: ai_recommendations insert, pending status, RLS for supervisor

9. Approve the recommendation — does it appear on the student profile?
   ✓ Confirms: content_approved, review_status update, profile query

10. Invite a parent — does the invite work?
    ✓ Confirms: admin API, parent_student_links, Supabase invite email
    ⚠️ Note: Requires Bug A5 to be fixed first (invite activation route)

11. Log in as parent — does the simplified profile show correctly?
    ✓ Confirms: parent RLS, parent-only view (no draft signatures, no raw assessments)
    ✓ Critical: verify parent cannot see any other student via URL manipulation

12. Submit a home observation as parent — does it appear in supervisor queue as unverified?
    ✓ Confirms: parent insert policy, is_verified=false enforcement
```

---

## 15. Recommended Next Development Phase After v0.1 Runs

Once the 5 blocking bugs are fixed, migrations run, and the Section 14 test sequence passes, v0.1 is functional for a pilot with 1–3 schools.

### Immediate post-launch fixes (before wider rollout)

1. **Error boundaries** — Add `error.tsx` in each route group. Without these, any server-side error shows a Next.js default error page.
2. **Loading skeletons** — Add `loading.tsx` for dashboard and student profile pages.
3. **PDF export** — Build the route using `@react-pdf/renderer` with Arabic font (this is harder than it sounds — Arabic requires RTL and right font registration).
4. **Rate limiting on AI routes** — Prevent a single user from exhausting Claude API quota.
5. **Pagination** — Student list, assessment history, and AI queue.

### Phase 2 features (after pilot proves the model)

Based on the original architecture spec, these unlock when 10+ schools, 100+ students, NPS 50+:

1. **Life Bridge / Transition Planner** — Map skill profile to real-world opportunities
2. **Skill Certificate engine** — Generate dignified, school-stamped capability certificates
3. **AI pathway recommendations** — Match ability signature to vocational pathways
4. **Family home activity suggestions** — AI-generated weekly practice activities for parents
5. **Regional supervisor dashboard** — Cross-school analytics for ministry oversight
6. **Mobile app (React Native)** — Offline-capable field assessments

### Phase 3 (national platform)

1. Ministry of Education (Noor) integration
2. HRDF connection — skill profiles feed workforce matching
3. Third-party API for ecosystem partners
4. National disability registry integration
5. GCC expansion

---

## Summary Scorecard

| Area | Status | Blocking? |
|---|---|---|
| Database schema + RLS | ✅ Complete | No |
| Authentication | ✅ Complete | No |
| Supervisor dashboard | ✅ Complete | No |
| Student profile page | 🔴 Bug (import order) | **YES** |
| Assessment form | 🟡 Works, preview broken | No |
| AI signature generation | ✅ Complete | No |
| AI review queue | ✅ Complete | No |
| Parent portal | 🔴 Invite activation missing | **YES** |
| Principal analytics | ✅ Complete | No |
| PDF export | ❌ Not built | No |
| Environment config | ✅ Complete | No |
| Vercel config | 🟡 `next.config.ts` needs fix | **YES** |
| Security | 🟡 AI rate limiting missing | No (non-blocking) |

**Blocking bugs before any deployment: 3**
**Estimated fix time: 4–6 hours**
**Status: Ready for staging after bug fixes. Not ready for production.**

---

*This report reflects the honest state of the codebase as audited on the files generated in this project session.*
*الإنسان أكبر من تصنيفه.*
