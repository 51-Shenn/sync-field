import math
from dataclasses import dataclass
from typing import Dict, List, Set, Union
from ortools.sat.python import cp_model


@dataclass
class Assignment:
    technician_id: str
    task_id: str
    score: float


class VRPSolver:
    def __init__(self, engine, technicians_db: Dict[str, dict]):
        self.engine = engine
        self.technicians = technicians_db

    @staticmethod
    def _distance(tech: dict, task: dict) -> float:
        t_lat = tech.get("lat")
        t_lng = tech.get("lng")
        task_lat = task.get("lat")
        task_lng = task.get("lng")
        if t_lat is None or t_lng is None or task_lat is None or task_lng is None:
            return 0.0
        return math.sqrt((t_lat - task_lat) ** 2 + (t_lng - task_lng) ** 2)

    def _is_eligible(self, tech: dict, task: dict, now_hour: float) -> bool:
        required = set(task.get("required_skills", []))
        if required and not required.issubset(set(tech.get("skills", []))):
            return False

        for item, qty in task.get("required_materials_qty", {}).items():
            if tech.get("van_inventory", {}).get(item, 0) < qty:
                return False

        duration = task.get("estimated_duration_hours", 2)
        shift_end = tech.get("shift_end_hour", 18)
        if now_hour + duration > shift_end:
            return False

        return True

    def solve_reassignment(
        self, idle_technician_ids: List[str], exclude_tasks: Set[str], now_hour: float = 9.0
    ) -> List[Assignment]:
        ready_tasks = {
            t_id: t for t_id, t in self.engine.tasks.items()
            if t["state"] == "READY" and t_id not in exclude_tasks and not t.get("assigned_to")
        }

        if not ready_tasks or not idle_technician_ids:
            return []

        model = cp_model.CpModel()
        x = {}

        for tech_id in idle_technician_ids:
            tech = self.technicians.get(tech_id)
            if tech is None:
                continue
            for task_id, task in ready_tasks.items():
                if self._is_eligible(tech, task, now_hour):
                    x[(tech_id, task_id)] = model.NewBoolVar(f"x_{tech_id}_{task_id}")

        if not x:
            return []

        for tech_id in idle_technician_ids:
            vars_for_tech = [v for (t, _), v in x.items() if t == tech_id]
            if vars_for_tech:
                model.Add(sum(vars_for_tech) <= 1)

        for task_id in ready_tasks:
            vars_for_task = [v for (_, k), v in x.items() if k == task_id]
            if vars_for_task:
                model.Add(sum(vars_for_task) <= 1)

        objective_terms = []
        for (tech_id, task_id), var in x.items():
            tech = self.technicians[tech_id]
            task = ready_tasks[task_id]
            priority = self.engine.compute_priority(task_id).score
            distance_penalty = self._distance(tech, task) * 5.0
            weight = int((priority - distance_penalty) * 100)
            objective_terms.append(weight * var)

        model.Maximize(sum(objective_terms))

        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 2.0
        status = solver.Solve(model)

        results: List[Assignment] = []
        if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            for (tech_id, task_id), var in x.items():
                if solver.Value(var) == 1:
                    results.append(Assignment(tech_id, task_id, solver.ObjectiveValue()))

        return results
