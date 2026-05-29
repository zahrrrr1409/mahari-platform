-- ================================================================
-- Mahari v0.1 — Migration 005: Indexes
-- ================================================================

create index idx_students_school      on public.students(school_id)         where deleted_at is null;
create index idx_students_profile     on public.students(profile_id)        where profile_id is not null;

create index idx_assess_student_time  on public.skill_assessments(student_id, assessed_at desc);
create index idx_assess_domain_latest on public.skill_assessments(domain_id, student_id, assessed_at desc);
create index idx_assess_school        on public.skill_assessments(school_id);

create index idx_obs_student_time     on public.observations(student_id, observed_at desc) where deleted_at is null;
create index idx_obs_verified         on public.observations(student_id, is_verified)      where deleted_at is null;

create index idx_plans_student_status on public.skill_plans(student_id, status)            where deleted_at is null;

create index idx_ai_recs_pending      on public.ai_recommendations(school_id, review_status) where review_status = 'pending';
create index idx_ai_recs_student      on public.ai_recommendations(student_id, generated_at desc);

create index idx_sup_assign_active    on public.supervisor_assignments(supervisor_id)       where is_active = true;
create index idx_sup_student_active   on public.supervisor_assignments(student_id)          where is_active = true;
create index idx_tch_assign_active    on public.teacher_assignments(teacher_id)             where is_active = true;
create index idx_parent_links_active  on public.parent_student_links(parent_id)             where activated_at is not null;
create index idx_parent_links_student on public.parent_student_links(student_id);

create index idx_audit_resource       on public.audit_logs(resource_type, resource_id);
create index idx_audit_user_time      on public.audit_logs(user_id, created_at desc);
create index idx_audit_school_time    on public.audit_logs(school_id, created_at desc);

create index idx_profiles_school_role on public.profiles(school_id, role)                  where deleted_at is null and is_active = true;
