import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const tables = await pool.query(`
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_name in ('projects','tasks','technicians','subtasks','task_commands','task_events','alerts','processed_messages')
  `);
  const columns = await pool.query(`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks'
      and column_name in ('priority','estimated_duration_hours','lat','lng','required_materials_qty')
  `);
  const rls = await pool.query(`
    select relname, relrowsecurity from pg_class
    where relname in ('projects','tasks','technicians','subtasks','task_commands','task_events','alerts','processed_messages')
  `);
  const publication = await pool.query(`
    select tablename from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename in ('projects','tasks','technicians','subtasks','task_commands','task_events','alerts','processed_messages')
  `);
  const commandForeignKey = await pool.query(`
    select delete_rule from information_schema.referential_constraints
    where constraint_schema = 'public' and constraint_name = 'task_commands_project_id_fkey'
  `);

  await pool.query("begin");
  await pool.query("set local role anon");
  const anonymous = await pool.query("select count(*)::int as count from projects");
  await pool.query("rollback");

  await pool.query("begin");
  await pool.query("set local role authenticated");
  const authenticated = await pool.query("select count(*)::int as count from projects");
  await pool.query("rollback");

  const summary = {
    tables: tables.rowCount,
    taskColumns: columns.rowCount,
    rlsEnabled: rls.rows.filter((row) => row.relrowsecurity).length,
    realtimeTables: publication.rowCount,
    commandProjectDeleteRule: commandForeignKey.rows[0]?.delete_rule,
    anonymousVisibleProjects: anonymous.rows[0].count,
    authenticatedVisibleProjects: authenticated.rows[0].count,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (summary.tables !== 8 || summary.taskColumns !== 5 || summary.rlsEnabled !== 8 || summary.realtimeTables !== 8 || summary.commandProjectDeleteRule !== "SET NULL" || summary.anonymousVisibleProjects !== 0) {
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}
