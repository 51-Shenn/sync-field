-- 004_add_task_events_depth.sql
-- sync_to_supabase() writes a cascade `depth` per event (0 = direct/manual,
-- >0 = downstream cascade ripple). task_events was created without it, causing
-- PGRST204 "Could not find the 'depth' column". Add it; safe to re-run.
alter table task_events add column if not exists depth integer default 0;
