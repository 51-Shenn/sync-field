import asyncio
import threading
from datetime import datetime
from uuid import uuid4

from backend.workflow.dag_engine.dag_engine import SyncFieldDAG
from backend.workflow.template_guesser import TemplateGuesser


DATETIME_FIELDS = ("blocked_since", "scheduled_start", "deadline", "earliest_start")


def hydrate_task_rows(rows: list[dict]) -> list[dict]:
    hydrated = []
    for row in rows:
        task = dict(row)
        task["task_id"] = task.pop("id", task.get("task_id"))
        for field in DATETIME_FIELDS:
            value = task.get(field)
            if isinstance(value, str):
                try:
                    task[field] = datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
                except ValueError:
                    task[field] = None
        hydrated.append(task)
    return hydrated


class CommandProcessor:
    """Claims durable UI commands and executes them through the DAG dispatcher."""

    def __init__(self, dispatcher, solver, sb_client):
        self.dispatcher = dispatcher
        self.solver = solver
        self.sb = sb_client
        # Serializes command execution: multiple Realtime INSERT events each spawn
        # a drain thread, and they share one mutable DAG engine. Without this lock a
        # transition can run on a stale graph before a create's reload lands
        # ("Task ... not found").
        self._lock = threading.Lock()

    def _ensure_engine_task(self, task_id: str) -> None:
        """Guarantee the in-memory graph has the task before mutating it. Reloads
        once from the DB to absorb a just-committed create; raises a clear error
        only if it genuinely does not exist."""
        if task_id in self.dispatcher.engine.tasks:
            return
        self.reload_graph()
        if task_id not in self.dispatcher.engine.tasks:
            raise ValueError(f"Task {task_id} not found")

    def _valid_assignee(self, value):
        """assigned_to is a uuid FK to technicians; drop anything that is not a
        known technician (dashboard actor ids, 'llm', stale ids)."""
        return value if value in self.solver.technicians else None

    def reload_graph(self) -> None:
        rows = self.sb.table("tasks").select("*").execute().data or []
        hydrated = hydrate_task_rows(rows)
        previous_states = {task["task_id"]: task.get("state") for task in hydrated}
        engine = SyncFieldDAG(hydrated)
        self.dispatcher.engine = engine
        self.solver.engine = engine
        graph_events = [
            {
                "task_id": task_id,
                "old_state": previous_states[task_id],
                "new_state": task["state"],
                "depth": 0,
                "reason": "Dependencies evaluated after graph reload",
            }
            for task_id, task in engine.tasks.items()
            if previous_states.get(task_id) != task.get("state")
        ]
        engine.sync_to_supabase(graph_events, self.sb)

    def _claim(self) -> dict | None:
        rows = self.sb.rpc("claim_next_task_command").execute().data or []
        return rows[0] if rows else None

    def _finish(self, command_id: str, result: dict) -> None:
        self.sb.table("task_commands").update({
            "status": "succeeded", "result": self._json_safe(result), "error": None,
            "completed_at": datetime.now().isoformat(),
        }).eq("id", command_id).execute()

    @classmethod
    def _json_safe(cls, value):
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, dict):
            return {key: cls._json_safe(item) for key, item in value.items() if key != "_events"}
        if isinstance(value, (list, tuple, set)):
            return [cls._json_safe(item) for item in value]
        if hasattr(value, "__dict__"):
            return cls._json_safe(value.__dict__)
        return value

    def _fail(self, command_id: str, error: Exception) -> None:
        self.sb.table("task_commands").update({
            "status": "failed", "error": str(error)[:1000],
            "completed_at": datetime.now().isoformat(),
        }).eq("id", command_id).execute()

    def drain(self) -> None:
        # One drainer at a time. Concurrent drains corrupt the shared engine.
        with self._lock:
            while True:
                command = self._claim()
                if not command:
                    return
                try:
                    self._finish(command["id"], self.execute(command))
                except Exception as error:
                    self._fail(command["id"], error)

    def execute(self, command: dict) -> dict:
        command_type = command["command_type"]
        task_id = command.get("task_id")
        project_id = command.get("project_id")
        payload = command.get("payload") or {}
        actor = command.get("requested_by") or "dashboard"

        if command_type == "task.create":
            new_id = task_id or f"T_{uuid4().hex[:10].upper()}"
            self.sb.table("tasks").insert({
                "id": new_id,
                "project_id": project_id,
                "task_name": payload.get("title") or "Untitled task",
                "state": payload.get("state") or "LOCKED",
                "dependencies": payload.get("dependencies") or [],
                "assigned_to": self._valid_assignee(payload.get("assigneeId")),
                "deadline": payload.get("deadline") or None,
                "priority": payload.get("priority") or "medium",
                "estimated_duration_hours": payload.get("estimatedDurationHours") or 2,
                "required_skills": payload.get("requiredSkills") or [],
            }).execute()
            self.reload_graph()
            return {"taskId": new_id}

        if command_type == "task.update":
            if not task_id:
                raise ValueError("taskId is required")
            field_map = {
                "title": "task_name", "deadline": "deadline", "priority": "priority",
                "estimatedDurationHours": "estimated_duration_hours",
                "dependencies": "dependencies", "requiredSkills": "required_skills",
            }
            update = {column: payload[key] for key, column in field_map.items() if key in payload}
            if not update:
                raise ValueError("No supported task fields supplied")
            self.sb.table("tasks").update(update).eq("id", task_id).execute()
            self.reload_graph()
            return {"taskId": task_id, "updated": list(update)}

        if command_type == "task.delete":
            if not task_id:
                raise ValueError("taskId is required")
            self.sb.table("tasks").delete().eq("id", task_id).execute()
            self.reload_graph()
            return {"taskId": task_id, "deleted": True}

        if command_type == "task.transition":
            if not task_id:
                raise ValueError("taskId is required")
            self._ensure_engine_task(task_id)
            target = str(payload.get("state") or "")
            technician_id = payload.get("technicianId") or actor
            if target == "ACTIVE":
                return self.dispatcher.process_start_report(task_id, technician_id)
            if target == "COMPLETE":
                return self.dispatcher.process_completion_report(task_id, technician_id)
            if target == "BLOCKED":
                return self.dispatcher.process_failure_report(
                    task_id, payload.get("failureType") or "SITE_NOT_READY", technician_id
                )
            events = self.dispatcher.engine.update_task_state(
                task_id, target, f"Dashboard command by {actor}"
            )
            self.dispatcher._sync(events)
            return {"task_id": task_id, "events_triggered": len(events)}

        if command_type == "task.assign":
            if not task_id:
                raise ValueError("taskId is required")
            self._ensure_engine_task(task_id)
            technician_id = self._valid_assignee(payload.get("technicianId"))
            self.dispatcher.engine.tasks[task_id]["assigned_to"] = technician_id
            self.dispatcher.persist_tasks([task_id])
            return {"taskId": task_id, "technicianId": technician_id}

        if command_type == "technician.absence":
            technician_id = payload.get("technicianId")
            if not technician_id:
                raise ValueError("technicianId is required")
            return self.dispatcher.handle_absence(technician_id)

        if command_type == "project.delete":
            if not project_id:
                raise ValueError("projectId is required")
            self.sb.table("projects").delete().eq("id", project_id).execute()
            self.reload_graph()
            return {"projectId": project_id, "deleted": True}

        if command_type == "project.instantiate_template":
            if not project_id:
                raise ValueError("projectId is required")
            task_names = payload.get("taskNames") or []
            if not task_names:
                raise ValueError("taskNames is required")
            guesser = TemplateGuesser(self.sb)
            guesses = guesser.guess_template(task_names)
            tasks = guesser.instantiate(
                guesses, project_id,
                payload.get("sitePrefix") or f"P{project_id[:6].upper()}",
                float(payload.get("confidenceThreshold") or 0.5),
            )
            rows = []
            for task in tasks:
                row = dict(task)
                row["id"] = row.pop("task_id")
                rows.append(row)
            self.sb.table("tasks").insert(rows).execute()
            self.reload_graph()
            return {"projectId": project_id, "taskIds": [row["id"] for row in rows]}

        raise ValueError(f"Unsupported command type: {command_type}")


class CommandQueueListener:
    def __init__(self, processor: CommandProcessor, async_sb):
        self.processor = processor
        self.async_sb = async_sb
        self.channel = None

    def _on_insert(self, _payload: dict) -> None:
        asyncio.create_task(asyncio.to_thread(self.processor.drain))

    async def start(self) -> None:
        self.channel = self.async_sb.channel("task_commands_worker")
        self.channel.on_postgres_changes(
            "INSERT", callback=self._on_insert, schema="public", table="task_commands"
        )
        await self.channel.subscribe()
        await asyncio.to_thread(self.processor.drain)
        print("[Commands] Listening for task commands")

    def start_sync(self) -> None:
        asyncio.create_task(self.start())

    async def stop(self) -> None:
        if self.channel:
            await self.async_sb.remove_channel(self.channel)
            self.channel = None
