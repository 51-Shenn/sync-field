-- 006: Add missing columns + new tables + seed mock-data for documents, site_reports, audit_logs, activities

alter table technicians add column if not exists email text;
alter table technicians add column if not exists avatar_url text;
alter table technicians add column if not exists manager_id text;
alter table technicians add column if not exists project_ids text[] default '{}';

alter table projects add column if not exists team_ids text[] default '{}';

create table if not exists documents (
  id text primary key,
  name text not null,
  type text not null,
  project_id text references projects(id) on delete set null,
  uploaded_by text,
  uploaded_at text not null,
  size_kb int
);

create table if not exists site_reports (
  id text primary key,
  project_id text,
  title text not null,
  type text not null default 'update',
  description text,
  status text not null default 'open',
  created_by text,
  created_at text not null,
  attachments text[] default '{}'
);

create table if not exists audit_logs (
  id text primary key,
  action text not null,
  entity text not null,
  entity_id text not null,
  entity_name text not null,
  performed_by text not null,
  "timestamp" text not null,
  details text
);

create table if not exists activities (
  id text primary key,
  person text not null,
  action text not null,
  target text not null,
  "time" text not null
);

alter table documents enable row level security;
alter table site_reports enable row level security;
alter table audit_logs enable row level security;
alter table activities enable row level security;

drop policy if exists "workspace authenticated read" on documents;
create policy "workspace authenticated read" on documents for select to authenticated using (true);
drop policy if exists "workspace authenticated read" on site_reports;
create policy "workspace authenticated read" on site_reports for select to authenticated using (true);
drop policy if exists "workspace authenticated read" on audit_logs;
create policy "workspace authenticated read" on audit_logs for select to authenticated using (true);
drop policy if exists "workspace authenticated read" on activities;
create policy "workspace authenticated read" on activities for select to authenticated using (true);

do $$
declare
  t text;
begin
  foreach t in array array['documents', 'site_reports', 'audit_logs', 'activities'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

-- Activities
insert into activities (id, person, action, target, "time") values
  ('a1', 'John', 'uploaded a permit to', 'Riverside Tower', '18 min ago'),
  ('a2', 'Elena', 'completed the daily log for', 'Riverside Tower', '42 min ago'),
  ('a3', 'Priya', 'approved Landscape Package for', 'Oakwood Residences', '2 hr ago'),
  ('a4', 'James', 'commented on a drawing in', 'Metro Transit Hub', '3 hr ago'),
  ('a5', 'Sofia', 'closed 3 punch items at', 'Summit School', 'Yesterday')
on conflict (id) do nothing;

-- Audit logs
insert into audit_logs (id, action, entity, entity_id, entity_name, performed_by, "timestamp", details) values
  ('al1', 'created', 'project', 'riverside', 'Riverside Tower', 'Marcus Chen', 'Jun 15, 2026 09:14', 'Project created with 6 team members.'),
  ('al2', 'updated', 'worker', 'tm5', 'Noah Williams', 'Marcus Chen', 'Jun 16, 2026 11:32', 'Status changed to on_leave.'),
  ('al3', 'created', 'report', 'sr3', 'Building C foundation pour', 'Priya Shah', 'Jun 17, 2026 08:05', 'Site update report created.'),
  ('al4', 'updated', 'project', 'oakwood', 'Oakwood Residences', 'Elena Rodriguez', 'Jun 18, 2026 14:20', 'Progress updated to 42%.'),
  ('al6', 'created', 'report', 'sr1', 'Level 14 rebar issue', 'Elena Rodriguez', 'Jun 19, 2026 15:30', 'Site issue report created.'),
  ('al7', 'created', 'worker', 'tm11', 'Carlos Mendez', 'Marcus Chen', 'Jun 20, 2026 07:12', 'New electrician added to workforce.'),
  ('al8', 'updated', 'report', 'sr2', 'Weekly progress update', 'Sofia Patel', 'Jun 20, 2026 09:44', 'Report status changed to resolved.')
on conflict (id) do nothing;

-- Documents
insert into documents (id, name, type, project_id, uploaded_by, uploaded_at, size_kb) values
  ('d1', 'Issued for Construction Set.pdf', 'pdf', 'riverside', 'tm10', 'Jun 20, 2026', 18420),
  ('d2', 'Building Permit — Revision 04.pdf', 'pdf', 'riverside', 'tm2', 'Jun 19, 2026', 2840),
  ('d3', 'Level 14 Progress Photos.zip', 'image', 'riverside', 'tm8', 'Jun 18, 2026', 48200),
  ('d4', 'Curtain Wall Submittal.pdf', 'pdf', 'riverside', 'tm7', 'Jun 17, 2026', 9200),
  ('d5', 'Civil Grading Plan.pdf', 'pdf', 'oakwood', 'tm3', 'Jun 16, 2026', 12500),
  ('d6', 'Cost Report — May.xlsx', 'spreadsheet', 'oakwood', 'tm6', 'Jun 14, 2026', 864),
  ('d7', 'Coastal Commission Comments.docx', 'doc', 'harbor', 'tm10', 'Jun 12, 2026', 540),
  ('d8', 'Structural Steel Bid Comparison.xlsx', 'spreadsheet', 'harbor', 'tm6', 'Jun 11, 2026', 392),
  ('d9', 'Transit Hub Design Narrative.docx', 'doc', 'metro', 'tm3', 'Jun 09, 2026', 1180),
  ('d10', 'Utility Survey.pdf', 'pdf', 'metro', 'tm9', 'Jun 08, 2026', 7800),
  ('d11', 'Medical Equipment Schedule.xlsx', 'spreadsheet', 'crestline', 'tm7', 'Jun 07, 2026', 724),
  ('d12', 'Commissioning Photos.zip', 'image', 'crestline', 'tm4', 'Jun 04, 2026', 64300),
  ('d13', 'Certificate of Occupancy.pdf', 'pdf', 'summit', 'tm10', 'May 28, 2026', 1200),
  ('d14', 'Existing Conditions Photos.zip', 'image', 'market', 'tm2', 'Jun 20, 2026', 31500)
on conflict (id) do nothing;

-- Site reports
insert into site_reports (id, project_id, title, type, description, status, created_by, created_at, attachments) values
  ('sr1', 'riverside', 'Level 14 rebar issue', 'issue', 'Some rebar splices are out of tolerance as per ACI 318.', 'open', 'tm2', 'Jun 19, 2026', '{rebar_photo_01.jpg}'),
  ('sr2', 'riverside', 'Weekly progress update', 'update', 'Concrete pour complete. Plumbing rough-in on schedule.', 'resolved', 'tm8', 'Jun 18, 2026', '{progress_report_w24.pdf}'),
  ('sr3', 'oakwood', 'Building C foundation pour', 'update', 'Foundation pour completed successfully.', 'resolved', 'tm1', 'Jun 17, 2026', '{cylinder_break_report.pdf}'),
  ('sr4', 'harbor', 'Coastal permit non-conformance', 'issue', 'Erosion control measures not per approved plan.', 'open', 'tm3', 'Jun 20, 2026', '{erosion_control_photo.jpg,ncr_001.pdf}')
on conflict (id) do nothing;
