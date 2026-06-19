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
