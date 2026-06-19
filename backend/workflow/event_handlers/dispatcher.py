from backend.workflow.dag_engine.dag_engine import FieldOpsDomainRules


class FieldOpsDispatcher:
    def __init__(self, engine, solver, notifier):
        self.engine = engine
        self.solver = solver
        self.notifier = notifier

    def process_failure_report(self, task_id: str, failure_type: str, technician_id: str) -> dict:
        decision = FieldOpsDomainRules.handle_task_failure(
            self.engine, task_id, failure_type, technician_id
        )

        if decision["action"] == "RETRY_LOCAL":
            self.notifier.notify(technician_id, decision["msg"])
            return decision

        self.notifier.alert(role=decision["escalate_to_role"], payload=decision["msg"])

        idle_tech_ids = [t["technician_id"] for t in decision["affected_technicians"]]
        blocked_task_ids = {t["task_id"] for t in decision["affected_technicians"]}

        assignments = self.solver.solve_reassignment(idle_tech_ids, exclude_tasks=blocked_task_ids)
        assigned_techs = {a.technician_id for a in assignments}

        for a in assignments:
            self.engine.tasks[a.task_id]["assigned_to"] = a.technician_id
            self.notifier.notify(
                a.technician_id,
                f"Rerouted to {a.task_id} (priority score {a.score:.1f})"
            )

        for tech_id in idle_tech_ids:
            if tech_id not in assigned_techs:
                self.notifier.notify(tech_id, "No eligible task available — standby.")

        for t in decision["affected_technicians"]:
            if t["technician_id"] in assigned_techs:
                self.engine.tasks[t["task_id"]]["assigned_to"] = None

        decision["rerouting_results"] = [
            {"technician_id": a.technician_id, "new_task": a.task_id} for a in assignments
        ]
        return decision


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
