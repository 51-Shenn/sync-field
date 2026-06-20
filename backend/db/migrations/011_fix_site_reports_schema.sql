-- 011: Fix site_reports column name 'type' -> 'report_type' to match codebase
-- The original migration 006 used 'type' but all application code references 'report_type'.
-- This migration safely renames if needed (idempotent).

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'site_reports' and column_name = 'type'
  ) then
    execute 'alter table site_reports rename column "type" to report_type';
  end if;
end $$;
