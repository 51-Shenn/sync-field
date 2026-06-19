from typing import Dict, Union


class StubVRPSolver:
    def __init__(self, engine):
        self.engine = engine

    def find_best_reassignment(self, technician_id: str, exclude_task: str) -> Union[dict, None]:
        for t_id, task in self.engine.tasks.items():
            if t_id != exclude_task and task["state"] == "READY" and task.get("assigned_to") is None:
                return task
        return None
