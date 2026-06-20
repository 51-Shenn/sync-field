-- Canonical operations contract shared by the Next.js dashboard and Python worker.
-- Safe to run repeatedly against the existing Supabase project.

alter table projects add column if not exists client text default '';
alter table projects add column if not exists location text default '';
alter table projects add column if not exists description text default '';
alter table projects add column if not exists start_date date;
alter table projects add column if not exists end_date date;
alter table projects add column if not exists manager_id uuid references technicians(id) on delete set null;
alter table projects add column if not exists color text default '#f97316';
alter table projects add column if not exists updated_at timestamptz default now();

alter table tasks add column if not exists priority text default 'medium';
alter table tasks add column if not exists estimated_duration_hours double precision default 2;
alter table tasks add column if not exists lat double precision;
alter table tasks add column if not exists lng double precision;
alter table tasks add column if not exists required_items jsonb default '{}';
alter table tasks add column if not exists required_materials_qty jsonb default '{}';

create table if not exists subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id text not null references tasks(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'done')),
  assignee_id uuid references technicians(id) on delete set null,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists task_commands (
  id uuid primary key default gen_random_uuid(),
  command_type text not null,
  task_id text,
  project_id uuid references projects(id) on delete set null,
  payload jsonb not null default '{}',
  requested_by text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'succeeded', 'failed')),
  result jsonb,
  error text,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);

alter table task_commands drop constraint if exists task_commands_project_id_fkey;
alter table task_commands add constraint task_commands_project_id_fkey
  foreign key (project_id) references projects(id) on delete set null;

create index if not exists idx_subtasks_task_id on subtasks(task_id);
create index if not exists idx_task_commands_status_created on task_commands(status, created_at);
create index if not exists idx_task_commands_requested_by on task_commands(requested_by, created_at desc);

-- Claim one command transactionally. SKIP LOCKED keeps multiple worker replicas safe.
create or replace function claim_next_task_command()
returns setof task_commands
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_id uuid;
begin
  select id into claimed_id
  from task_commands
  where status = 'pending'
  order by created_at
  for update skip locked
  limit 1;

  if claimed_id is null then
    return;
  end if;

  return query
  update task_commands
  set status = 'processing', started_at = now(), error = null
  where id = claimed_id
  returning *;
end;
$$;

revoke all on function claim_next_task_command() from public, anon, authenticated;
grant execute on function claim_next_task_command() to service_role;

-- Operational rows are readable only with a short-lived authenticated JWT.
-- Writes are performed by authenticated Next.js handlers or the service-role worker.
alter table sites enable row level security;
alter table projects enable row level security;
alter table technicians enable row level security;
alter table tasks enable row level security;
alter table subtasks enable row level security;
alter table task_events enable row level security;
alter table alerts enable row level security;
alter table processed_messages enable row level security;
alter table task_commands enable row level security;

drop policy if exists "workspace authenticated read" on sites;
create policy "workspace authenticated read" on sites for select to authenticated using (true);
drop policy if exists "workspace authenticated read" on projects;
create policy "workspace authenticated read" on projects for select to authenticated using (true);
drop policy if exists "workspace authenticated read" on technicians;
create policy "workspace authenticated read" on technicians for select to authenticated using (true);
drop policy if exists "workspace authenticated read" on tasks;
create policy "workspace authenticated read" on tasks for select to authenticated using (true);
drop policy if exists "workspace authenticated read" on subtasks;
create policy "workspace authenticated read" on subtasks for select to authenticated using (true);
drop policy if exists "workspace authenticated read" on task_events;
create policy "workspace authenticated read" on task_events for select to authenticated using (true);
drop policy if exists "workspace authenticated read" on alerts;
create policy "workspace authenticated read" on alerts for select to authenticated using (true);
drop policy if exists "workspace authenticated read" on processed_messages;
create policy "workspace authenticated read" on processed_messages for select to authenticated using (true);
drop policy if exists "workspace authenticated read" on task_commands;
create policy "workspace authenticated read" on task_commands for select to authenticated using (true);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'sites', 'projects', 'technicians', 'tasks', 'subtasks',
    'task_events', 'alerts', 'processed_messages', 'task_commands'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table %I', table_name);
    end if;
  end loop;
end $$;
