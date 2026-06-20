import assert from "node:assert/strict";
import {
  buildTaskCreateRow,
  buildTaskTransitionUpdate,
  buildTaskUpdate,
  deleteTaskWithReferences,
} from "../src/lib/task-command-mutations.ts";

const now = "2026-06-21T00:00:00.000Z";
const created = buildTaskCreateRow({
  projectId: "project-1",
  payload: {
    title: "Install camera",
    state: "ACTIVE",
    priority: "high",
    assigneeId: "tech-1",
    estimatedDurationHours: 3,
  },
}, "T_TEST", now);

assert.deepEqual(created, {
  id: "T_TEST",
  project_id: "project-1",
  task_name: "Install camera",
  state: "ACTIVE",
  dependencies: [],
  assigned_to: "tech-1",
  deadline: null,
  priority: "high",
  estimated_duration_hours: 3,
  required_skills: [],
  blocked_since: null,
  updated_at: now,
});

assert.deepEqual(buildTaskTransitionUpdate("ACTIVE", "BLOCKED", now), {
  state: "BLOCKED",
  blocked_since: now,
  updated_at: now,
});
assert.deepEqual(buildTaskTransitionUpdate("BLOCKED", "ACTIVE", now), {
  state: "ACTIVE",
  blocked_since: null,
  updated_at: now,
});
assert.deepEqual(buildTaskUpdate({ title: "Updated", estimatedDurationHours: 4 }, now), {
  task_name: "Updated",
  estimated_duration_hours: 4,
  updated_at: now,
});

const references = new Map([
  ["task_events", new Set(["T_TEST"])],
  ["processed_messages", new Set(["T_TEST"])],
  ["alerts", new Set(["T_TEST"])],
]);
let taskDeleted = false;
await deleteTaskWithReferences("T_TEST", {
  async clearTaskReference(table, taskId) {
    references.get(table).delete(taskId);
  },
  async deleteTask(taskId) {
    const blockingTable = [...references].find(([, taskIds]) => taskIds.has(taskId))?.[0];
    if (blockingTable) throw new Error(`${blockingTable}_task_id_fkey`);
    taskDeleted = true;
  },
});
assert.equal(taskDeleted, true);
assert.deepEqual([...references.values()].map((taskIds) => taskIds.size), [0, 0, 0]);

console.log("verified serverless Kanban task command mutations");
