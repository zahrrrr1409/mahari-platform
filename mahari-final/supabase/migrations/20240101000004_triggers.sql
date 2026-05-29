-- ================================================================
-- Mahari v0.1 — Migration 004: Triggers
-- ================================================================

-- ─── UPDATED_AT ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_students_updated_at
  before update on public.students
  for each row execute function public.set_updated_at();

create trigger trg_skill_plans_updated_at
  before update on public.skill_plans
  for each row execute function public.set_updated_at();

-- ─── SKILL PROFILE AUTO-CREATE ───────────────────────────────────
-- Every student gets an empty profile row the moment they are created.
create or replace function public.auto_create_skill_profile()
returns trigger as $$
begin
  insert into public.skill_profiles (student_id, school_id)
  values (new.id, new.school_id)
  on conflict (student_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_auto_create_profile
  after insert on public.students
  for each row execute function public.auto_create_skill_profile();

-- ─── PROFILE STRENGTH AUTO-RECALCULATION ─────────────────────────
-- Fires after every INSERT to skill_assessments.
-- DISTINCT ON gets the latest level per domain, then sums.
-- Formula: (sum of latest domain levels / 24) * 100
-- Unassessed domains = 0 (absent from subquery).
create or replace function public.recalc_profile_strength()
returns trigger as $$
begin
  update public.skill_profiles
  set
    profile_strength = (
      select coalesce(round(sum(latest.lvl) * 100.0 / 24)::integer, 0)
      from (
        select distinct on (domain_id)
          maturity_level as lvl
        from public.skill_assessments
        where student_id = new.student_id
        order by domain_id, assessed_at desc
      ) latest
    ),
    last_updated_at = now()
  where student_id = new.student_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_recalc_strength
  after insert on public.skill_assessments
  for each row execute function public.recalc_profile_strength();

-- ─── ABILITY SIGNATURE VERSION ARCHIVE ───────────────────────────
-- When supervisor approves a new signature (version increments),
-- the prior approved signature is archived.
create or replace function public.archive_old_signature()
returns trigger as $$
begin
  if new.version > old.version and old.ability_signature is not null then
    insert into public.skill_profile_versions
      (profile_id, ability_signature, profile_strength, version)
    values
      (old.id, old.ability_signature, old.profile_strength, old.version);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_archive_signature
  before update on public.skill_profiles
  for each row execute function public.archive_old_signature();
