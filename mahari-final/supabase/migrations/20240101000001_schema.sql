-- ================================================================
-- Mahari v0.1 — Migration 001: Schema
-- Supabase-native: profiles table extends auth.users.
-- NO custom session variables — RLS uses auth.uid() and auth.jwt().
-- ================================================================

-- ─── SCHOOLS ─────────────────────────────────────────────────────
create table public.schools (
  id          uuid        primary key default gen_random_uuid(),
  name_ar     text        not null,
  name_en     text,
  region      text        not null,
  ministry_id text,
  tier        text        not null default 'standard'
                check (tier in ('standard','premium')),
  created_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

comment on table public.schools is 'Schools enrolled in the Mahari platform';

-- ─── PROFILES ────────────────────────────────────────────────────
-- Extends auth.users. id = auth.uid() — no email or password_hash here.
-- role and school_id are also stored in auth.users.app_metadata
-- (set server-side via service_role) so RLS policies can read them
-- from the JWT without a DB round-trip.
create table public.profiles (
  id          uuid        primary key references auth.users on delete cascade,
  name_ar     text        not null,
  name_en     text,
  role        text        not null
                check (role in ('student','teacher','supervisor',
                                'parent','principal','admin')),
  school_id   uuid        references public.schools(id),
  is_active   boolean     not null default true,
  last_login  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

comment on table public.profiles is
  'User profiles — extends auth.users. No email or password stored here.';
comment on column public.profiles.role is
  'Mirror of app_metadata.role. Kept in sync by trigger on auth.users update.';

-- ─── STUDENTS ────────────────────────────────────────────────────
-- IMPORTANT: no diagnosis column, ever.
create table public.students (
  id              uuid        primary key default gen_random_uuid(),
  profile_id      uuid        unique references public.profiles(id), -- optional login
  school_id       uuid        not null references public.schools(id),
  name_ar         text        not null,
  name_en         text,
  grade_level     text,
  program_type    text,
  enrollment_date date        not null default current_date,
  transition_year integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

comment on column public.students.profile_id is
  'Nullable — students do not always have platform logins in v0.1';

-- ─── CLINICAL CONTEXT ────────────────────────────────────────────
-- Access-gated. NEVER joined to capability queries.
-- Only the AI anonymization layer may read this — and it strips it.
create table public.clinical_context (
  id                        uuid        primary key default gen_random_uuid(),
  student_id                uuid        not null references public.students(id),
  data_encrypted            bytea       not null,
  authorized_supervisor_ids uuid[],
  created_by                uuid        references public.profiles(id),
  created_at                timestamptz not null default now()
);

comment on table public.clinical_context is
  'Encrypted clinical/diagnosis data. NEVER joined to capability queries. Every access audited.';

-- ─── SKILL DOMAINS (seeded, not user-editable) ───────────────────
create table public.skill_domains (
  id             uuid    primary key default gen_random_uuid(),
  name_en        text    not null,
  name_ar        text    not null,
  description_en text,
  description_ar text,
  color_hex      text,
  icon_key       text,
  display_order  integer not null,
  is_active      boolean not null default true
);

-- ─── SKILL PROFILES (one per student, auto-created by trigger) ───
create table public.skill_profiles (
  id                uuid    primary key default gen_random_uuid(),
  student_id        uuid    not null unique references public.students(id),
  school_id         uuid    not null references public.schools(id),
  ability_signature text,                  -- supervisor-approved, shown to parents
  sig_draft         text,                  -- AI draft pending supervisor review
  profile_strength  integer not null default 0
                      check (profile_strength between 0 and 100),
  version           integer not null default 1,
  last_updated_at   timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

comment on column public.skill_profiles.ability_signature is
  'Supervisor-approved only. This field is shown to parents and students.';
comment on column public.skill_profiles.sig_draft is
  'Claude API output — visible to supervisor only until approved.';

create table public.skill_profile_versions (
  id                uuid        primary key default gen_random_uuid(),
  profile_id        uuid        not null references public.skill_profiles(id),
  ability_signature text,
  profile_strength  integer,
  version           integer     not null,
  archived_at       timestamptz not null default now()
);

comment on table public.skill_profile_versions is
  'Append-only archive of every approved ability signature. Never deleted.';

-- ─── SKILL ASSESSMENTS (append-only) ────────────────────────────
create table public.skill_assessments (
  id               uuid        primary key default gen_random_uuid(),
  student_id       uuid        not null references public.students(id),
  domain_id        uuid        not null references public.skill_domains(id),
  assessor_id      uuid        not null references public.profiles(id),
  school_id        uuid        not null references public.schools(id),
  maturity_level   integer     not null check (maturity_level between 1 and 4),
  observation_note text        not null check (length(observation_note) >= 30),
  assessment_type  text        not null default 'formal'
                     check (assessment_type in ('formal','informal','observation')),
  assessed_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
  -- No updated_at — this table is strictly append-only. Never UPDATE.
);

-- ─── OBSERVATIONS ────────────────────────────────────────────────
create table public.observations (
  id             uuid        primary key default gen_random_uuid(),
  student_id     uuid        not null references public.students(id),
  observer_id    uuid        not null references public.profiles(id),
  school_id      uuid        not null references public.schools(id),
  observer_role  text        not null check (observer_role in ('supervisor','teacher','parent')),
  setting        text        not null check (setting in ('classroom','home','community','other')),
  content        text        not null check (length(content) >= 20),
  ai_domain_tags jsonb       not null default '[]',
  is_verified    boolean     not null default false,
  verified_by    uuid        references public.profiles(id),
  verified_at    timestamptz,
  observed_at    timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

-- ─── SKILL PLANS ─────────────────────────────────────────────────
create table public.skill_plans (
  id                 uuid        primary key default gen_random_uuid(),
  student_id         uuid        not null references public.students(id),
  domain_id          uuid        not null references public.skill_domains(id),
  created_by         uuid        not null references public.profiles(id),
  school_id          uuid        not null references public.schools(id),
  target_description text        not null check (length(target_description) >= 20),
  activities         jsonb       not null default '[]',
  target_date        date,
  status             text        not null default 'active'
                       check (status in ('active','completed','paused','abandoned')),
  progress_notes     text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

-- ─── AI RECOMMENDATIONS ──────────────────────────────────────────
create table public.ai_recommendations (
  id               uuid          primary key default gen_random_uuid(),
  student_id       uuid          not null references public.students(id),
  school_id        uuid          not null references public.schools(id),
  triggered_by     uuid          references public.skill_assessments(id),
  rec_type         text          not null check (rec_type in ('capability_insight','skill_focus')),
  content_draft    text          not null,
  content_approved text,
  confidence       numeric(3,2)  check (confidence between 0.00 and 1.00),
  review_status    text          not null default 'pending'
                     check (review_status in ('pending','approved','modified','rejected')),
  reviewed_by      uuid          references public.profiles(id),
  reviewer_notes   text,
  generated_at     timestamptz   not null default now(),
  reviewed_at      timestamptz
);

-- ─── ASSIGNMENTS ─────────────────────────────────────────────────
create table public.supervisor_assignments (
  id            uuid        primary key default gen_random_uuid(),
  supervisor_id uuid        not null references public.profiles(id),
  student_id    uuid        not null references public.students(id),
  school_id     uuid        not null references public.schools(id),
  assigned_by   uuid        references public.profiles(id),
  is_active     boolean     not null default true,
  assigned_at   timestamptz not null default now(),
  unique (supervisor_id, student_id)
);

create table public.teacher_assignments (
  id          uuid        primary key default gen_random_uuid(),
  teacher_id  uuid        not null references public.profiles(id),
  student_id  uuid        not null references public.students(id),
  school_id   uuid        not null references public.schools(id),
  is_active   boolean     not null default true,
  assigned_at timestamptz not null default now(),
  unique (teacher_id, student_id)
);

create table public.parent_student_links (
  id             uuid        primary key default gen_random_uuid(),
  parent_id      uuid        not null references public.profiles(id),
  student_id     uuid        not null references public.students(id),
  school_id      uuid        not null references public.schools(id),
  activated_at   timestamptz,
  created_at     timestamptz not null default now(),
  unique (parent_id, student_id)
);

-- ─── AUDIT LOG ───────────────────────────────────────────────────
create table public.audit_logs (
  id            bigserial   primary key,
  user_id       uuid        references public.profiles(id),
  action        text        not null,
  resource_type text        not null,
  resource_id   uuid,
  school_id     uuid,
  old_values    jsonb,
  new_values    jsonb,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);

comment on table public.audit_logs is 'Immutable. Never DELETE or UPDATE any row.';
