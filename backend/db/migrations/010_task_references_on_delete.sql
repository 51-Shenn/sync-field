-- Preserve operational history when a Kanban task is deleted.
-- Runtime handlers clear these references too so deletion remains compatible
-- with deployments where this migration has not been applied yet.

alter table processed_messages drop constraint if exists processed_messages_task_id_fkey;
alter table processed_messages add constraint processed_messages_task_id_fkey
  foreign key (task_id) references tasks(id) on delete set null;

alter table task_events drop constraint if exists task_events_task_id_fkey;
alter table task_events add constraint task_events_task_id_fkey
  foreign key (task_id) references tasks(id) on delete set null;

alter table alerts drop constraint if exists alerts_task_id_fkey;
alter table alerts add constraint alerts_task_id_fkey
  foreign key (task_id) references tasks(id) on delete set null;
