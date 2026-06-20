from datetime import datetime, timedelta, date

from backend.workflow.dag_engine.dag_engine import FieldOpsDomainRules, DEFAULT_POLICIES


class FieldOpsDispatcher:
    def __init__(self, engine, solver, notifier, policies=None, sb_client=None):
        self.engine = engine
        self.solver = solver
        self.notifier = notifier
        self.domain_rules = FieldOpsDomainRules(policies or DEFAULT_POLICIES)
        self.sb_client = sb_client

    def process_failure_report(self, task_id: str, failure_type: str, technician_id: str) -> dict:
        decision = self.domain_rules.handle_task_failure(
            self.engine, task_id, failure_type, technician_id
        )

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

    def _tech_name(self, technician_id: str) -> str:
        tech = self.solver.technicians.get(technician_id, {})
        return tech.get("name", technician_id)

    def handle_absence(self, technician_id: str, now_hour: float = 9.0) -> dict:
        tech_name = self._tech_name(technician_id)
        print(f"[DISPATCH] handle_absence({technician_id})", flush=True)

        orphaned = [
            {"task_id": t_id, "state": t["state"]}
            for t_id, t in self.engine.tasks.items()
            if t.get("assigned_to") == technician_id
        ]
        print(f"[DISPATCH] orphaned tasks for {technician_id}: {[o['task_id'] + '(' + o['state'] + ')' for o in orphaned]}", flush=True)

        freed_ids: list = []
        for task in orphaned:
            t_id = task["task_id"]
            self.engine.tasks[t_id]["assigned_to"] = None
            if task["state"] == "ACTIVE":
                self.engine.tasks[t_id]["state"] = "READY"
                print(f"[DISPATCH] demoted {t_id}: ACTIVE -> READY", flush=True)
                self.notifier.notify(
                    f"task_{t_id}",
                    f"Task {t_id} demoted from ACTIVE to READY — {tech_name} absent."
                )
            freed_ids.append(t_id)

        all_idle_techs = [
            tech_id for tech_id in self.solver.technicians
            if tech_id != technician_id
            and not any(
                t.get("assigned_to") == tech_id
                for t in self.engine.tasks.values()
            )
        ]
        print(f"[DISPATCH] idle technicians available: {len(all_idle_techs)}", flush=True)

        assignments = []
        try:
            assignments = self.solver.solve_reassignment(
                all_idle_techs, exclude_tasks=set(), now_hour=now_hour
            )
            print(f"[DISPATCH] VRP solver assignments: {len(assignments)}", flush=True)
        except Exception as e:
            import traceback
            print(f"[DISPATCH] VRP solver failed: {e}", flush=True)
            traceback.print_exc()

        for a in assignments:
            self.engine.tasks[a.task_id]["assigned_to"] = a.technician_id
            print(f"[DISPATCH] assigned {a.task_id} -> {self._tech_name(a.technician_id)} (score {a.score:.1f})", flush=True)
            self.notifier.notify(
                a.technician_id,
                f"Absorbed {a.task_id} (priority score {a.score:.1f})"
            )

        pm_msg = (
            f"{tech_name} is absent today (MC). "
            f"Freed {len(freed_ids)} task(s), "
            f"{len(assignments)} reassigned."
        )
        print(f"[DISPATCH] alerting project_manager: {pm_msg}", flush=True)
        self.notifier.alert(
            role="project_manager",
            payload=pm_msg,
        )

        if self.sb_client:
            today = date.today().isoformat()
            print(f"[DISPATCH] updating technician status: on_leave", flush=True)
            try:
                self.sb_client.table("technicians").update({
                    "status": "on_leave",
                    "leave_until": today,
                }).eq("id", technician_id).execute()
                print(f"[DISPATCH] status updated to on_leave", flush=True)
            except Exception:
                try:
                    self.sb_client.table("technicians").update({
                        "status": "on_leave",
                    }).eq("id", technician_id).execute()
                    print(f"[DISPATCH] status updated (without leave_until)", flush=True)
                except Exception as e:
                    print(f"[DISPATCH] status update failed: {e}", flush=True)

        return {
            "absent_technician": technician_id,
            "freed_tasks": freed_ids,
            "assignments": [
                {"technician_id": a.technician_id, "task_id": a.task_id}
                for a in assignments
            ],
        }
