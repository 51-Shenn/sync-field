from datetime import datetime, timedelta

from backend.workflow.dag_engine.dag_engine import FieldOpsDomainRules, DEFAULT_POLICIES


class FieldOpsDispatcher:
    def __init__(self, engine, solver, notifier, policies=None):
        self.engine = engine
        self.solver = solver
        self.notifier = notifier
        self.domain_rules = FieldOpsDomainRules(policies or DEFAULT_POLICIES)

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

    def handle_absence(self, technician_id: str, now_hour: float = 9.0) -> dict:
        orphaned = [
            {"task_id": t_id, "state": t["state"]}
            for t_id, t in self.engine.tasks.items()
            if t.get("assigned_to") == technician_id
        ]

        freed_ids: list = []
        for task in orphaned:
            t_id = task["task_id"]
            self.engine.tasks[t_id]["assigned_to"] = None
            if task["state"] == "ACTIVE":
                self.engine.tasks[t_id]["state"] = "READY"
                self.notifier.notify(
                    f"task_{t_id}",
                    f"Task {t_id} demoted from ACTIVE to READY — {technician_id} absent."
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


def dispatch_decision(engine, decision: dict, vrp_solver, notifier):
    if decision["action"] == "ESCALATE":
        notifier.alert(role=decision["escalate_to_role"], payload=decision["msg"])

        for tech in decision["affected_technicians"]:
            new_task = vrp_solver.find_best_reassignment(
                technician_id=tech["technician_id"],
                exclude_task=tech["task_id"]
            )
            if new_task:
                notifier.notify(
                    tech["technician_id"],
                    f"Rerouted to {new_task['task_id']} ({new_task['task_name']})"
                )
            else:
                notifier.notify(
                    tech["technician_id"],
                    "No alternative task available — standby"
                )

    elif decision["action"] == "RETRY_LOCAL":
        notifier.notify(decision["assignee"], decision["msg"])
