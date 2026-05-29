-- ================================================================
-- Mahari v0.1 — Migration 002: Auth Integration
-- Connects Supabase auth.users to our public.profiles table.
-- Provides auth_role() and auth_school_id() helpers for RLS.
-- ================================================================

-- ─── RLS HELPERS (read from JWT, no DB round-trip) ───────────────
-- app_metadata is set server-side via service_role key.
-- Users CANNOT modify their own app_metadata.
-- This is the secure RBAC source of truth.

create or replace function public.auth_uid() returns uuid as $$
  select auth.uid()
$$ language sql stable security definer;

create or replace function public.auth_role() returns text as $$
  select coalesce(
    auth.jwt()->'app_metadata'->>'role',
    auth.jwt()->'user_metadata'->>'role'  -- fallback during development
  )
$$ language sql stable security definer;

create or replace function public.auth_school_id() returns uuid as $$
  select coalesce(
    (auth.jwt()->'app_metadata'->>'school_id'),
    (auth.jwt()->'user_metadata'->>'school_id')
  )::uuid
$$ language sql stable security definer;

-- ─── PROFILE AUTO-CREATE ─────────────────────────────────────────
-- When an admin creates a user via the service-role API,
-- this trigger auto-inserts a profiles row.
-- name_ar, role, school_id are passed in raw_user_meta_data
-- at creation time, then promoted to app_metadata by the API route.

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.profiles (id, name_ar, name_en, role, school_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name_ar', new.email),
    new.raw_user_meta_data->>'name_en',
    coalesce(new.raw_user_meta_data->>'role', 'teacher'),
    (new.raw_user_meta_data->>'school_id')::uuid
  )
  on conflict (id) do update set
    name_ar   = excluded.name_ar,
    role      = excluded.role,
    school_id = excluded.school_id,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- ─── LAST LOGIN TRACKER ──────────────────────────────────────────
-- Keeps profiles.last_login in sync with actual auth sign-ins.
-- Supabase fires auth.sessions events — we hook into user updates.

create or replace function public.handle_auth_user_updated()
returns trigger as $$
begin
  if new.last_sign_in_at <> old.last_sign_in_at then
    update public.profiles
    set last_login = new.last_sign_in_at
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_auth_user_updated();
