# Mahari v0.1 — Deployment Guide

> **Status after this audit:** All 5 original blocking bugs fixed. All 12 production-readiness issues resolved. Ready for staging deployment.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| npm | 10+ | Bundled with Node.js |
| Supabase CLI | 1.170+ | `npm install -g supabase` |
| Git | Any | [git-scm.com](https://git-scm.com) |

---

## Step 1 — Local Setup

```bash
# Clone or unzip the project
cd mahari-final
npm install

# Copy environment template
cp .env.local.example .env.local
```

Edit `.env.local` with your actual values (see §4 for where to find each).

---

## Step 2 — Supabase Project Setup

### 2.1 Create project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Select region: **Middle East (Bahrain) / ap-southeast-1** — required for NCA compliance
3. Choose a strong database password and save it

### 2.2 Get API keys
**Project Settings → API:**
```
NEXT_PUBLIC_SUPABASE_URL       = https://YOUR_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = eyJh... (anon/public key)
SUPABASE_SERVICE_ROLE_KEY      = eyJh... (service_role key — SECRET)
```

### 2.3 Authentication configuration
**Authentication → Settings:**
- [ ] Disable "Enable new user signups" — Mahari is invite-only
- [ ] Set minimum password length to 8+

**Authentication → URL Configuration:**
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`

**Authentication → Email Templates → Invite User:**
- Customize with Mahari branding and Arabic subject line
- Default template works but is in English

### 2.4 SMTP for production (important)
Supabase free plan sends invite emails from `noreply@mail.app.supabase.io`.
This often lands in spam. For production:
**Project Settings → Authentication → SMTP Settings** → Add your SMTP provider.

---

## Step 3 — Run Database Migrations

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF_ID
# Enter your database password when prompted

# Verify 6 migrations are detected
supabase migration list

# Push all migrations
supabase db push
```

This runs in order:
| Migration | What it creates |
|-----------|----------------|
| `000001_schema` | All tables: profiles, students, skill_domains, skill_profiles, skill_assessments, observations, skill_plans, ai_recommendations, parent_student_links, audit_logs |
| `000002_auth` | Trigger: auto-creates `profiles` row on `auth.users` insert; JWT helper functions |
| `000003_rls` | 20+ Row-Level Security policies using `auth.uid()` |
| `000004_triggers` | Profile strength auto-recalc; ability signature versioning; updated_at |
| `000005_indexes` | Performance indexes on all hot query paths |
| `000006_seed` | 6 skill domains in Arabic + English |

**Verify seed data:** Dashboard → Table Editor → `skill_domains` → should show exactly 6 rows.

### After any future schema change
```bash
# Never edit existing migration files
# Always create a new one:
supabase migration new describe_your_change

# After pushing, regenerate TypeScript types:
npm run db:types
```

---

## Step 4 — Environment Variables Reference

### Public (safe to expose in browser — use NEXT_PUBLIC_ prefix)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
NEXT_PUBLIC_APP_URL=http://localhost:3000   # change in Vercel to production URL
NEXT_PUBLIC_APP_VERSION=0.1.0
```

### Server-only (NEVER expose to browser, NEVER commit to git)
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJh...           # bypasses all RLS — treat as root password
ANTHROPIC_API_KEY=sk-ant-api03-...          # from console.anthropic.com → API Keys
```

### AI governance
```bash
ANTHROPIC_MODEL=claude-sonnet-4-6
AI_CONFIDENCE_THRESHOLD=0.60               # flag insights below this
AI_MAX_RETRIES=3
```

### Finding Supabase keys
- URL and anon key: **Project Settings → API → Project URL / anon key**
- Service role key: **Project Settings → API → service_role key**

### ⚠️ Critical: `SUPABASE_SERVICE_ROLE_KEY` Security
This key bypasses all Row-Level Security. It is only used in:
- `src/lib/supabase/admin.ts` (server-only)
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/invite/route.ts`

Verify it is NOT in any client code:
```bash
grep -r "SERVICE_ROLE" src/app/(auth) src/components src/hooks
# Must return nothing
```

---

## Step 5 — Create First Admin User

Supabase doesn't allow public signup (disabled in §2.3). Create admin manually:

```bash
curl -X POST 'https://YOUR_REF.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourschool.edu.sa",
    "password": "StrongPassword123!",
    "email_confirm": true,
    "app_metadata": { "role": "admin", "school_id": null },
    "user_metadata": { "name_ar": "مدير النظام", "name_en": "System Admin" }
  }'
```

---

## Step 6 — Create First School Record

In Supabase Dashboard → Table Editor → `schools` → Insert row:
```
name_ar:    "مدرسة النور"
name_en:    "Al-Noor School"
region:     "الرياض"
tier:       "standard"
```
**Save the UUID** — you'll need it for all subsequent user creation.

---

## Step 7 — Verify Locally

```bash
npm run dev
# Open http://localhost:3000
```

Run this test sequence in order:
1. `http://localhost:3000` → should redirect to `/login`
2. Log in as admin → should redirect to `/dashboard`
3. Create a supervisor via `POST /api/admin/users`
4. Log in as supervisor → empty caseload dashboard should load
5. Create a student → profile auto-creates at 0%
6. Record 6 assessments at levels [3,2,4,2,4,3] → profile strength should show **75%**
7. Generate AI signature → appears in `/dashboard/review`
8. Approve → appears on student profile as ability signature

---

## Step 8 — Vercel Deployment

### 8.1 Push to GitHub
```bash
git init
git add .
git commit -m "feat: Mahari Platform v0.1"
git remote add origin https://github.com/your-org/mahari.git
git push -u origin main
```

**Verify `.env.local` is NOT committed:**
```bash
git status  # .env.local must not appear
```

### 8.2 Import to Vercel
1. [vercel.com](https://vercel.com) → New Project → Import Git Repository
2. Framework: **Next.js** (auto-detected)
3. Root directory: leave as `.` (project root)

### 8.3 Environment variables in Vercel Dashboard
**Project → Settings → Environment Variables** — add all from §4.

| Variable | Environment |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview + Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview + Development |
| `NEXT_PUBLIC_APP_URL` | Production only (set to `https://your-app.vercel.app`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Production only** — mark as Secret |
| `ANTHROPIC_API_KEY` | Production only — mark as Secret |
| `ANTHROPIC_MODEL` | Production only |
| `AI_CONFIDENCE_THRESHOLD` | Production only |
| `AI_MAX_RETRIES` | Production only |

### 8.4 Vercel plan note
AI routes set `maxDuration = 60` (seconds). This requires **Vercel Pro**.
On Hobby plan, the limit is 10 seconds — Claude responses may timeout.
Options:
- Upgrade to Vercel Pro ($20/month)
- Or reduce `maxDuration` to 10 and accept occasional timeouts (assessment still saves; only preview fails)

### 8.5 After deployment
1. Add your Vercel domain to Supabase redirect URLs:
   **Authentication → URL Configuration → Redirect URLs** → add `https://your-app.vercel.app/**`
2. Update `NEXT_PUBLIC_APP_URL` in Vercel to `https://your-app.vercel.app`
3. Redeploy to apply the updated env var

---

## Step 9 — Post-Deployment Security Checks

Run these after every deployment:

```bash
# 1. Unauthenticated admin call must return 401
curl -X POST https://your-app.vercel.app/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","nameAr":"test","role":"admin"}'
# Expected: {"success":false,"error":{"code":"AUTH_REQUIRED",...}}

# 2. No secrets in browser
# Open DevTools → Network → filter for "SERVICE_ROLE" or "sk-ant"
# Must appear in zero responses

# 3. Cross-school isolation
# Log in as Supervisor A (school X), navigate to student belonging to school Y
# Must return 404 or empty data
```

---

## Operational Notes

### Adding new users (ongoing)
All user creation goes through `POST /api/admin/users` (requires admin JWT).
Never create users directly in Supabase Dashboard — `app_metadata.role` must be set server-side.

### Inviting parents
Supervisors use `POST /api/admin/invite` with the student ID.
Supabase sends the invite email automatically.
The parent activates via the magic link → `/invite/[token]`.

### AI recommendations workflow
1. Assessment saved → AI insight generated automatically (async, fire-and-forget)
2. Insight appears in `/dashboard/review` with status `pending`
3. Supervisor approves, modifies, or rejects
4. Only `approved` or `modified` records are visible to parents/students

### Schema changes (production)
1. Create migration: `supabase migration new description`
2. Write SQL in the new file
3. Test locally with `supabase db reset` (warning: destroys local data)
4. Push to production: `supabase db push`
5. Regenerate types: `npm run db:types`
6. Commit updated `database.ts`

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| Login redirects back to login | `app_metadata.role` not set | Recreate user with service_role API (see §5) |
| AI route returns 503 | Claude API key invalid or quota exceeded | Check key in Anthropic console |
| AI route times out | Vercel Hobby 10s limit | Upgrade to Pro or reduce `maxDuration` |
| Student profile shows no domains | `skill_domains` table empty | Run migration `000006_seed` |
| Profile strength not updating | Trigger not firing | Check Supabase → Database → Triggers |
| Parent invite email not received | Default Supabase SMTP | Configure custom SMTP (§2.4) |
| `503 Service Unavailable` on API | Supabase project paused (free plan) | Resume project in Supabase dashboard |
