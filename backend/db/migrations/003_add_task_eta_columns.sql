-- backend/db/migrations/003_add_task_eta_columns.sql

alter table tasks add column if not exists earliest_start timestamptz;
alter table tasks add column if not exists eta_confidence text default 'UNKNOWN';
