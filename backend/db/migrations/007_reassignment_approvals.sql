-- Reassignment approval queue for Telegram inline-button workflow.
-- When a failure report escalates, the dispatcher queues an approval row and
-- posts Yes/No buttons to the Telegram group chat. On callback, the bot inserts
-- a reassignment.execute command into task_commands for the worker to pick up.

create table if not exists reassignment_approvals (
  id uuid primary key default gen_random_uuid(),
  task_id text,
  decision_json jsonb not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired')),
  approved_by text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create index if not exists idx_reassignment_approvals_status
  on reassignment_approvals(status, created_at);

alter table reassignment_approvals enable row level security;

drop policy if exists "workspace authenticated read" on reassignment_approvals;
create policy "workspace authenticated read" on reassignment_approvals
  for select to authenticated using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reassignment_approvals'
  ) then
    alter publication supabase_realtime add table reassignment_approvals;
  end if;
end $$;
