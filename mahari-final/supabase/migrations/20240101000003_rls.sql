-- ================================================================
-- Mahari v0.1 — Migration 003: Row-Level Security
-- Uses auth.uid() and public.auth_role() / auth_school_id().
-- No custom session variables — compatible with Supabase's
-- connection pooler (PgBouncer in transaction mode).
-- ================================================================

-- Enable RLS on every student-data table
alter table public.profiles            enable row level security;
alter table public.students            enable row level security;
alter table public.skill_profiles      enable row level security;
alter table public.skill_assessments   enable row level security;
alter table public.observations        enable row level security;
alter table public.skill_plans         enable row level security;
alter table public.ai_recommendations  enable row level security;
alter table public.supervisor_assignments enable row level security;
alter table public.teacher_assignments    enable row level security;
alter table public.parent_student_links   enable row level security;
alter table public.skill_profile_versions enable row level security;

-- ═══════════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════════
-- Users can always read their own profile
create policy "profiles: own read"
  on public.profiles for select
  using (id = auth.uid());

-- Supervisors and principals can read profiles in their school
create policy "profiles: school read"
  on public.profiles for select
  using (
    public.auth_role() in ('supervisor','principal','admin') and
    (school_id = public.auth_school_id() or public.auth_role() = 'admin')
  );

-- Users can update their own profile (name fields only — role/school via admin)
create policy "profiles: own update"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admin full access
create policy "profiles: admin all"
  on public.profiles for all
  using (public.auth_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════
-- STUDENTS
-- ═══════════════════════════════════════════════════════════════════
create policy "students: supervisor caseload"
  on public.students for select
  using (
    public.auth_role() = 'supervisor' and
    id in (
      select student_id from public.supervisor_assignments
      where supervisor_id = auth.uid() and is_active = true
    )
  );

create policy "students: teacher assigned"
  on public.students for select
  using (
    public.auth_role() = 'teacher' and
    id in (
      select student_id from public.teacher_assignments
      where teacher_id = auth.uid() and is_active = true
    )
  );

create policy "students: parent children"
  on public.students for select
  using (
    public.auth_role() = 'parent' and
    id in (
      select student_id from public.parent_student_links
      where parent_id = auth.uid() and activated_at is not null
    )
  );

create policy "students: principal school"
  on public.students for select
  using (
    public.auth_role() = 'principal' and
    school_id = public.auth_school_id()
  );

create policy "students: admin all"
  on public.students for all
  using (public.auth_role() = 'admin');

-- Supervisor can create students in their own school
create policy "students: supervisor insert"
  on public.students for insert
  with check (
    public.auth_role() = 'supervisor' and
    school_id = public.auth_school_id()
  );

-- Supervisor can update their assigned students
create policy "students: supervisor update"
  on public.students for update
  using (
    public.auth_role() = 'supervisor' and
    id in (
      select student_id from public.supervisor_assignments
      where supervisor_id = auth.uid() and is_active = true
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- SKILL PROFILES
-- ═══════════════════════════════════════════════════════════════════
create policy "skill_profiles: supervisor full"
  on public.skill_profiles for all
  using (
    public.auth_role() = 'supervisor' and
    student_id in (
      select student_id from public.supervisor_assignments
      where supervisor_id = auth.uid() and is_active = true
    )
  );

create policy "skill_profiles: teacher read"
  on public.skill_profiles for select
  using (
    public.auth_role() = 'teacher' and
    student_id in (
      select student_id from public.teacher_assignments
      where teacher_id = auth.uid() and is_active = true
    )
  );

-- Parent sees only approved content (ability_signature) — filtered in application layer too
create policy "skill_profiles: parent read"
  on public.skill_profiles for select
  using (
    public.auth_role() = 'parent' and
    student_id in (
      select student_id from public.parent_student_links
      where parent_id = auth.uid() and activated_at is not null
    )
  );

create policy "skill_profiles: principal read"
  on public.skill_profiles for select
  using (
    public.auth_role() = 'principal' and school_id = public.auth_school_id()
  );

create policy "skill_profiles: admin all"
  on public.skill_profiles for all
  using (public.auth_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════
-- SKILL ASSESSMENTS
-- ═══════════════════════════════════════════════════════════════════
create policy "skill_assessments: supervisor full"
  on public.skill_assessments for all
  using (
    public.auth_role() = 'supervisor' and
    student_id in (
      select student_id from public.supervisor_assignments
      where supervisor_id = auth.uid() and is_active = true
    )
  );

create policy "skill_assessments: teacher read+insert"
  on public.skill_assessments for select
  using (
    public.auth_role() = 'teacher' and
    student_id in (
      select student_id from public.teacher_assignments
      where teacher_id = auth.uid() and is_active = true
    )
  );

create policy "skill_assessments: teacher insert"
  on public.skill_assessments for insert
  with check (
    public.auth_role() = 'teacher' and
    school_id = public.auth_school_id() and
    student_id in (
      select student_id from public.teacher_assignments
      where teacher_id = auth.uid() and is_active = true
    )
  );

create policy "skill_assessments: principal read"
  on public.skill_assessments for select
  using (public.auth_role() = 'principal' and school_id = public.auth_school_id());

create policy "skill_assessments: admin all"
  on public.skill_assessments for all
  using (public.auth_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════
-- OBSERVATIONS
-- ═══════════════════════════════════════════════════════════════════
create policy "observations: supervisor full"
  on public.observations for all
  using (
    public.auth_role() = 'supervisor' and
    student_id in (
      select student_id from public.supervisor_assignments
      where supervisor_id = auth.uid() and is_active = true
    )
  );

create policy "observations: teacher full"
  on public.observations for all
  using (
    public.auth_role() = 'teacher' and
    student_id in (
      select student_id from public.teacher_assignments
      where teacher_id = auth.uid() and is_active = true
    )
  );

-- Parent: read verified only + insert own
create policy "observations: parent read verified"
  on public.observations for select
  using (
    public.auth_role() = 'parent' and
    is_verified = true and
    student_id in (
      select student_id from public.parent_student_links
      where parent_id = auth.uid() and activated_at is not null
    )
  );

create policy "observations: parent insert"
  on public.observations for insert
  with check (
    public.auth_role() = 'parent' and
    observer_id = auth.uid() and
    is_verified = false and
    student_id in (
      select student_id from public.parent_student_links
      where parent_id = auth.uid() and activated_at is not null
    )
  );

create policy "observations: admin all"
  on public.observations for all
  using (public.auth_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════
-- SKILL PLANS
-- ═══════════════════════════════════════════════════════════════════
create policy "skill_plans: supervisor full"
  on public.skill_plans for all
  using (
    public.auth_role() = 'supervisor' and
    student_id in (
      select student_id from public.supervisor_assignments
      where supervisor_id = auth.uid() and is_active = true
    )
  );

create policy "skill_plans: admin all"
  on public.skill_plans for all
  using (public.auth_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════
-- AI RECOMMENDATIONS
-- ═══════════════════════════════════════════════════════════════════
-- Supervisor sees all (including pending) for their school
create policy "ai_recs: supervisor full"
  on public.ai_recommendations for all
  using (
    public.auth_role() = 'supervisor' and
    school_id = public.auth_school_id()
  );

-- Parent/student see only approved content
create policy "ai_recs: parent approved"
  on public.ai_recommendations for select
  using (
    public.auth_role() in ('parent','student') and
    review_status in ('approved','modified') and
    student_id in (
      select student_id from public.parent_student_links
      where parent_id = auth.uid() and activated_at is not null
    )
  );

create policy "ai_recs: admin all"
  on public.ai_recommendations for all
  using (public.auth_role() = 'admin');

-- ═══════════════════════════════════════════════════════════════════
-- ASSIGNMENT TABLES
-- ═══════════════════════════════════════════════════════════════════
-- Supervisors can read their own assignments
create policy "sup_assignments: own read"
  on public.supervisor_assignments for select
  using (supervisor_id = auth.uid() or public.auth_role() in ('admin','principal'));

create policy "sup_assignments: admin all"
  on public.supervisor_assignments for all
  using (public.auth_role() in ('admin','principal'));

create policy "tch_assignments: own read"
  on public.teacher_assignments for select
  using (teacher_id = auth.uid() or public.auth_role() in ('admin','principal','supervisor'));

create policy "tch_assignments: admin all"
  on public.teacher_assignments for all
  using (public.auth_role() in ('admin','supervisor'));

create policy "parent_links: supervisor manage"
  on public.parent_student_links for all
  using (public.auth_role() in ('admin','supervisor'));

create policy "parent_links: parent own"
  on public.parent_student_links for select
  using (parent_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- READ-ONLY PUBLIC TABLES (no RLS needed — these are reference data)
-- ═══════════════════════════════════════════════════════════════════
-- skill_domains: all authenticated users can read
create policy "skill_domains: authenticated read"
  on public.skill_domains for select
  using (auth.role() = 'authenticated');

alter table public.skill_domains enable row level security;
