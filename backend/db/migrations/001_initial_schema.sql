-- ============================================
-- CORE ENTITIES — Field Operations DAG
-- ============================================

-- Sites (buildings/locations)
create table if not exists sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  power_ready boolean default true,
  access_status text default 'open',
  created_at timestamptz default now()
);

-- Projects (a site can have multiple projects, typically 1:1)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  site_id uuid references sites(id),
  status text default 'active',
  created_at timestamptz default now()
);

-- Technicians (field staff)
create table if not exists technicians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  telegram_id text,
  role text default 'technician',
  skills text[] default '{}',
  lat double precision,
  lng double precision,
  shift_start time default '08:00',
  shift_end time default '18:00',
  van_inventory jsonb default '{}',
  status text default 'available',
  created_at timestamptz default now()
);

-- Tasks = DAG nodes. IDs are text matching Python ("T01", "T02").
create table if not exists tasks (
  id text primary key,
  project_id uuid references projects(id) on delete cascade,
  task_name text not null,
  state text not null default 'LOCKED',
  dependencies text[] default '{}',
  assigned_to uuid references technicians(id),
  failure_category text,
  attempt_count int default 0,
  blocked_since timestamptz,
  scheduled_start timestamptz,
  deadline timestamptz,
  required_skills text[],
  requires_shared_tool boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Original messages (raw, exactly what came in from Telegram, before any LLM analysis)
create table if not exists original_messages (
  id uuid primary key default gen_random_uuid(),
  telegram_id text,
  sender_name text,
  chat_title text,
  sent_at timestamptz,
  type text,
  text text not null,
  replied_to text,
  created_at timestamptz default now()
);

-- Processed messages (Tier 1/2/3 resolution audit trail — the LLM's classification of one original_messages row)
create table if not exists processed_messages (
  id uuid primary key default gen_random_uuid(),
  original_message_id uuid references original_messages(id) on delete cascade,
  technician_id uuid references technicians(id),
  task_id text references tasks(id),
  label text,
  status text,
  material text,
  quantity numeric,
  resolved_state text,
  resolved_failure_type text,
  tier_resolved text,
  confidence numeric,
  note text,
  created_at timestamptz default now()
);

-- Task events (state transitions — drives cascade animation)
create table if not exists task_events (
  id uuid primary key default gen_random_uuid(),
  task_id text references tasks(id),
  old_state text,
  new_state text,
  reason text,
  triggered_by text,
  created_at timestamptz default now()
);

-- Alerts (fired by routing/dispatcher layer)
create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  task_id text references tasks(id),
  target_role text,
  target_technician_id uuid references technicians(id),
  category text,
  message text,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Resolution cache (exact-match LLM cost optimization)
create table if not exists resolution_cache (
  cache_key text primary key,
  resolved_state text,
  resolved_failure_type text,
  hit_count int default 1,
  created_at timestamptz default now()
);

-- ============================================
-- SUPABASE REALTIME
-- ============================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table tasks;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'task_events'
  ) then
    alter publication supabase_realtime add table task_events;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'alerts'
  ) then
    alter publication supabase_realtime add table alerts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'processed_messages'
  ) then
    alter publication supabase_realtime add table processed_messages;
  end if;
end $$;

-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_tasks_state on tasks(state);
create index if not exists idx_task_events_task_id on task_events(task_id);
create index if not exists idx_task_events_created_at on task_events(created_at desc);
create index if not exists idx_alerts_status on alerts(status);
create index if not exists idx_original_messages_created_at on original_messages(created_at desc);
create index if not exists idx_processed_messages_original_message_id on processed_messages(original_message_id);
create index if not exists idx_processed_messages_task_id on processed_messages(task_id);
