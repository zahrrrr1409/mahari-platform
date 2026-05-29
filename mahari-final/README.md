# مهاري — Mahari Platform v0.1

> **من التصنيف إلى التمكين المهاري**
> A capability discovery and empowerment platform for students with special needs.

---

## Core Philosophy

Mahari shifts the fundamental question from **"What is the disability?"** to **"What ability can shape this student's future?"**

The platform documents and grows student capabilities across 6 domains, generates AI-powered ability signatures, and connects education with life pathways — all without a diagnosis field in sight.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, RTL-first |
| Backend | Supabase (Auth + PostgreSQL + Storage) + Next.js API Routes |
| AI | Anthropic Claude API (anonymized payloads only) |
| Deployment | Vercel (frontend) + Supabase Cloud |
| Styling | Tailwind CSS + CSS Custom Properties |

---

## Project Structure

```
mahari/
├── supabase/
│   ├── config.toml
│   └── migrations/           # 6 ordered SQL migrations
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, invite activation
│   │   ├── (supervisor)/     # Dashboard, students, AI review
│   │   ├── (principal)/      # School analytics
│   │   ├── (parent)/         # Simplified capability portal
│   │   └── api/              # AI, admin, students endpoints
│   ├── components/
│   │   ├── layout/           # Sidebar, header
│   │   ├── students/         # Signature, radar, domain cards
│   │   ├── assessments/      # 4-step assessment stepper
│   │   ├── ai/               # Recommendation review cards
│   │   ├── dashboard/        # Stat cards
│   │   └── ui/               # Buttons, badges
│   ├── hooks/                # useUser, useStudents, useAssessments
│   └── lib/
│       ├── supabase/         # client.ts, server.ts, admin.ts
│       ├── ai/               # anonymize.ts, client.ts, prompts.ts
│       ├── types/            # database.ts, index.ts
│       └── utils/            # maturity.ts, domains.ts
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── vercel.json
```

---

## Quick Start

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key
- [Supabase CLI](https://supabase.com/docs/guides/cli): `npm install -g supabase`

### 2. Clone and install

```bash
git clone https://github.com/your-org/mahari.git
cd mahari
npm install
```

### 3. Environment setup

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get Supabase keys from: **Project Settings → API** in your Supabase dashboard.

### 4. Run database migrations

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
supabase db push
```

This runs all 6 migrations in order:
- `001` — Full schema (profiles, students, assessments, etc.)
- `002` — Auth integration (trigger, JWT helpers)
- `003` — Row-Level Security policies
- `004` — Triggers (profile strength, signature archive)
- `005` — Performance indexes
- `006` — Seed data (6 skill domains)

### 5. Create the first admin user

In your Supabase dashboard → **Authentication → Users → Invite user**, or via API:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.edu.sa",
    "password": "SecurePassword123!",
    "email_confirm": true,
    "app_metadata": { "role": "admin", "school_id": null },
    "user_metadata": { "name_ar": "المدير" }
  }'
```

Then use `POST /api/admin/users` to create supervisors, teachers, and principals.

### 6. Start development

```bash
npm run dev
# Open http://localhost:3000
```

---

## User Roles

| Role | Arabic | Access |
|---|---|---|
| `admin` | المدير | Full system access |
| `supervisor` | المشرف المهاري | Caseload: profiles, assessments, AI review, parent invites |
| `teacher` | المعلم | Assigned students: read + submit assessments |
| `parent` | ولي الأمر | Own child: simplified profile + submit home observations |
| `principal` | قائد المدرسة | School-level aggregate analytics (read-only) |

Roles are stored in Supabase `app_metadata` (server-only, not user-editable) and power all RLS policies automatically.

---

## Key Architectural Decisions

### 1. No diagnosis field — ever
The `students` table has no `diagnosis` column. API routes reject any body containing diagnosis-related fields with `422`. Clinical context lives in a separate access-gated table.

### 2. Supabase RLS as the authorization layer
Row-Level Security policies use `auth.uid()` and `auth.jwt()->'app_metadata'` — no custom session variables needed. Works correctly with Supabase's PgBouncer connection pooler.

### 3. Human-in-the-loop AI (architectural, not convention)
All AI outputs write to `ai_recommendations.review_status = 'pending'`. The profile endpoint cannot return pending records. Supervisors approve before anything reaches students or parents.

### 4. Anonymized AI payloads
The `anonymize.ts` module strips all PII before every Claude API call. Student names, school names, and identifying data never leave the Saudi server boundary.

### 5. Profile strength formula
`(Σ domain levels / 24) × 100` — unassessed domains = 0. Rewards both assessment completeness and skill depth.

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — Mahari v0.1"
git remote add origin https://github.com/your-org/mahari.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Add environment variables (from `.env.local`)
4. Deploy

### 3. Vercel environment variables

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL       → your Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  → your anon key
SUPABASE_SERVICE_ROLE_KEY      → your service role key (server only)
ANTHROPIC_API_KEY              → your Claude API key (server only)
NEXT_PUBLIC_APP_URL            → https://your-app.vercel.app
```

### 4. Update Supabase Auth redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**`

---

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run typecheck    # TypeScript check (no emit)
npm run db:types     # Generate Supabase types (after schema changes)
npm run db:migrate   # Push pending migrations
npm run db:reset     # Reset local DB (development only)
```

---

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never exposed to the browser
- `ANTHROPIC_API_KEY` is server-only — only used in `/api/ai/*` routes
- All student data stays within Saudi Arabia (configure Supabase region accordingly)
- NCA compliance: database must be in a Saudi-compliant region

---

## Contributing

This platform is purpose-built. Before adding features, ask: **does this serve the student's capability journey, or does it serve administrative convenience?**

---

*الإنسان أكبر من تصنيفه — The human is greater than their classification.*
