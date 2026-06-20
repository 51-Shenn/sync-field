-- backend/db/migrations/007_performance_rpc.sql
-- Replace 10 HTTP round-trips with a single RPC call returning all
-- operational tables as one JSON object.

create or replace function get_operations_snapshot()
returns json
language plpgsql
stable
parallel safe
as $$
declare
  result json;
begin
  select json_build_object(
    'projects', coalesce((
      select json_agg(row_to_json(t)) from (
        select p.*, row_to_json(s.*) as sites
        from projects p
        left join sites s on s.id = p.site_id
        order by p.created_at
      ) t
    ), '[]'::json),
    'tasks', coalesce((
      select json_agg(row_to_json(t)) from (
        select * from tasks order by created_at
      ) t
    ), '[]'::json),
    'subtasks', coalesce((
      select json_agg(row_to_json(t)) from (
        select * from subtask order by "createdAt"
      ) t
    ), '[]'::json),
    'technicians', coalesce((
      select json_agg(row_to_json(t)) from (
        select * from technicians order by name
      ) t
    ), '[]'::json),
    'task_events', coalesce((
      select json_agg(row_to_json(t)) from (
        select * from task_events order by created_at desc limit 100
      ) t
    ), '[]'::json),
    'alerts', coalesce((
      select json_agg(row_to_json(t)) from (
        select * from alerts order by created_at desc limit 50
      ) t
    ), '[]'::json),
    'processed_messages', coalesce((
      select json_agg(row_to_json(t)) from (
        select * from processed_messages order by created_at desc limit 50
      ) t
    ), '[]'::json),
    'task_commands', coalesce((
      select json_agg(row_to_json(t)) from (
        select * from task_commands order by created_at desc limit 50
      ) t
    ), '[]'::json),
    'site_reports', coalesce((
      select json_agg(row_to_json(t)) from (
        select * from site_reports order by created_at desc limit 100
      ) t
    ), '[]'::json),
    'documents', coalesce((
      select json_agg(row_to_json(t)) from (
        select * from documents order by created_at desc limit 50
      ) t
    ), '[]'::json)
  ) into result;

  return result;
end;
$$;
