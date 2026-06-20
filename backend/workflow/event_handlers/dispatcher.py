from datetime import datetime, timedelta

from backend.workflow.dag_engine.dag_engine import FieldOpsDomainRules, DEFAULT_POLICIES


class FieldOpsDispatcher:
    def __init__(self, engine, solver, notifier, policies=None, sb_client=None):
        self.engine = engine
        self.solver = solver
        self.notifier = notifier
        self.domain_rules = FieldOpsDomainRules(policies or DEFAULT_POLICIES)
        self.sb = sb_client

    def _sync(self, events: list) -> None:
        if self.sb and events:
            self.engine.sync_to_supabase(events, self.sb)

    def process_failure_report(self, task_id: str, failure_type: str, technician_id: str) -> dict:
        decision = self.domain_rules.handle_task_failure(
            self.engine, task_id, failure_type, technician_id
        )

        self._sync(decision.get("_events", []))

        if decision["action"] == "RETRY_LOCAL":
            self.notifier.notify(technician_id, decision["msg"])
            return decision

        self.notifier.alert(role=decision["escalate_to_role"], payload=decision["msg"])

        cascade_eta = self.engine.compute_cascade_eta(task_id)
        decision["cascade_eta"] = cascade_eta

        for t in decision["affected_technicians"]:
            t_id = t["task_id"]
            eta = cascade_eta.get(t_id)
            if eta:
                t["eta_notification"] = self._build_eta_notification(t_id, eta)

        displaced_techs = [t["technician_id"] for t in decision["affected_technicians"]]
        blocked_task_ids = {t["task_id"] for t in decision["affected_technicians"]}

        assignments = self.solver.solve_reassignment(displaced_techs, exclude_tasks=blocked_task_ids)
        assigned_techs = {a.technician_id for a in assignments}

        for a in assignments:
            self.engine.tasks[a.task_id]["assigned_to"] = a.technician_id
            self.notifier.notify(
                a.technician_id,
                f"Rerouted to {a.task_id} (priority score {a.score:.1f})"
            )

        for tech_id in displaced_techs:
            if tech_id not in assigned_techs:
                self.notifier.notify(tech_id, "No eligible task available — standby.")

        for t in decision["affected_technicians"]:
            if t["technician_id"] in assigned_techs:
                self.engine.tasks[t["task_id"]]["assigned_to"] = None

        decision["rerouting_results"] = [
            {"technician_id": a.technician_id, "new_task": a.task_id} for a in assignments
        ]
        return decision

    @staticmethod
    def _build_eta_notification(task_id: str, eta: dict) -> str:
        confidence = eta.get("eta_confidence", "UNKNOWN")
        start = eta.get("earliest_start")
        finish = eta.get("earliest_finish")

        if confidence == "EXACT" and start:
            return (
                f"Task {task_id} unblocked. "
                f"Earliest start: {start.strftime('%d %b %H:%M')}."
            )
        elif confidence == "ESTIMATED" and start:
            return (
                f"Task {task_id} blocked. "
                f"Estimated earliest start: ~{start.strftime('%d %b %H:%M')} "
                f"(approximate — based on upstream estimates)."
            )
        else:
            return (
                f"Task {task_id} blocked. "
                f"Cannot estimate start time — awaiting upstream resolution. "
                f"You will be notified when status updates."
            )

    def process_start_report(self, task_id: str, technician_id: str) -> dict:
        events = self.engine.update_task_state(
            task_id, "ACTIVE", f"LLM: task start reported by {technician_id}"
        )
        self._sync(events)
        self.engine.tasks[task_id]["assigned_to"] = technician_id
        self.notifier.notify(
            technician_id,
            f"Task {task_id} started — marked ACTIVE."
        )
        return {
            "task_id": task_id,
            "technician_id": technician_id,
            "events_triggered": len(events),
        }

    def process_completion_report(self, task_id: str, technician_id: str) -> dict:
        """
        Processes a manual or automated task completion. Updates DAG state
        and triggers joint VRP reassignments for newly unlocked READY tasks.
        """
        events = self.engine.update_task_state(
            task_id, "COMPLETE", f"Completion reported by {technician_id}"
        )
        self._sync(events)

        unlocked_task_ids = [
            e["task_id"] for e in events
            if e["new_state"] == "READY"
        ]

        active_assignments = {
            t.get("assigned_to") for t in self.engine.tasks.values()
            if t.get("assigned_to") and t["state"] in ("ACTIVE", "READY")
        }
        idle_tech_ids = [
            tech_id for tech_id in self.solver.technicians
            if tech_id not in active_assignments
        ]

        assignments = []
        if idle_tech_ids:
            assignments = self.solver.solve_reassignment(idle_tech_ids, exclude_tasks=set())

            for a in assignments:
                self.engine.tasks[a.task_id]["assigned_to"] = a.technician_id
                self.notifier.notify(
                    a.technician_id,
                    f"Task {a.task_id} unlocked and assigned (priority score {a.score:.1f})"
                )

        for tech_id in idle_tech_ids:
            if tech_id not in {a.technician_id for a in assignments}:
                self.notifier.notify(tech_id, "No eligible newly-unlocked task — standby.")

        return {
            "task_id": task_id,
            "events_triggered": len(events),
            "unlocked_tasks": unlocked_task_ids,
            "new_assignments": [
                {"technician_id": a.technician_id, "task_id": a.task_id}
                for a in assignments
            ],
        }

    def handle_absence(self, technician_id: str, now_hour: float = 9.0) -> dict:
        orphaned = [
            {"task_id": t_id, "state": t["state"]}
            for t_id, t in self.engine.tasks.items()
            if t.get("assigned_to") == technician_id
        ]

        freed_ids: list = []
        all_events: list = []
        for task in orphaned:
            t_id = task["task_id"]
            self.engine.tasks[t_id]["assigned_to"] = None
            if task["state"] == "ACTIVE":
                events = self.engine.update_task_state(
                    t_id, "READY", f"Demoted from ACTIVE to READY — {technician_id} absent"
                )
                all_events.extend(events)
            freed_ids.append(t_id)
        self._sync(all_events)

        all_idle_techs = [
            tech_id for tech_id in self.solver.technicians
            if tech_id != technician_id
            and not any(
                t.get("assigned_to") == tech_id
                for t in self.engine.tasks.values()
            )
        ]

        assignments = self.solver.solve_reassignment(
            all_idle_techs, exclude_tasks=set(), now_hour=now_hour
        )

        for a in assignments:
            self.engine.tasks[a.task_id]["assigned_to"] = a.technician_id
            self.notifier.notify(
                a.technician_id,
                f"Absorbed {a.task_id} (priority score {a.score:.1f})"
            )

        self.notifier.alert(
            role="project_manager",
            payload=(
                f"Technician {technician_id} absent. "
                f"Freed {len(freed_ids)} task(s), "
                f"{len(assignments)} reassigned."
            )
        )

        return {
            "absent_technician": technician_id,
            "freed_tasks": freed_ids,
            "assignments": [
                {"technician_id": a.technician_id, "task_id": a.task_id}
                for a in assignments
            ],
        }

