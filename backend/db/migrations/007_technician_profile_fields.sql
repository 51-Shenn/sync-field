-- 007_technician_profile_fields.sql
-- The workforce UI form collects email, project assignments, and a reporting
-- manager, but the technicians table (migration 001) only stored operational
-- fields. Add the profile columns so worker CRUD round-trips. Safe to re-run.
alter table technicians add column if not exists email text;
alter table technicians add column if not exists project_ids text[] default '{}';
alter table technicians add column if not exists manager_id uuid references technicians(id) on delete set null;
