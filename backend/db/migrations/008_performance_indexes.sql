-- backend/db/migrations/008_performance_indexes.sql
-- Indexes on foreign keys and sort columns for tables queried by get_operations_snapshot().

create index if not exists idx_site_reports_project_id on site_reports(project_id);
create index if not exists idx_site_reports_created_at on site_reports(created_at desc);

create index if not exists idx_documents_project_id on documents(project_id);
create index if not exists idx_documents_created_at on documents(created_at desc);

create index if not exists idx_task_events_created_at on task_events(created_at desc);
create index if not exists idx_alerts_created_at on alerts(created_at desc);
create index if not exists idx_processed_messages_created_at on processed_messages(created_at desc);
create index if not exists idx_task_commands_created_at on task_commands(created_at desc);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
