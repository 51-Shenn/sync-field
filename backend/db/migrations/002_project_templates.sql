-- backend/db/migrations/002_project_templates.sql

create table if not exists project_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  tasks jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_project_templates_name on project_templates(name);
