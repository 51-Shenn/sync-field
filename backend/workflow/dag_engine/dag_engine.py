from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Set, Callable, Union

# --- 1. Failure Taxonomy & Domain Configurations ---
FAILURE_CATEGORIES = {
    "RESOURCE":  ["MATERIAL_MISSING", "TOOL_DAMAGED", "TOOL_MISSING"],
    "SITE":      ["SITE_NOT_READY", "NO_POWER", "ACCESS_DENIED"],
    "TECHNICAL": ["CONFIG_CONFLICT", "TEST_FAILED", "IP_CONFLICT"],
    "QUALITY":   ["BLUR", "WRONG_ANGLE", "DEFECTIVE_UNIT"],
}

CATEGORY_TO_ROLE = {
    "RESOURCE":  "procurement_lead",
    "SITE":      "project_manager",
    "TECHNICAL": "network_specialist",
    "QUALITY":   "site_supervisor",
}

CATEGORY_URGENCY_WEIGHT = {
    "TECHNICAL": 15.0,
    "SITE":      10.0,
    "RESOURCE":   8.0,
    "QUALITY":    5.0,
}

# Define the explicit physical-world state space
VALID_STATES = {
    "LOCKED",      # Dependencies/preconditions not met
    "READY",       # Dependencies met, ready for dispatch
    "ACTIVE",      # Technician currently on-site working
    "BLOCKED",     # Started but halted by external issue (material/site)
    "REGRESSED",   # Was complete, but must be redone due to cascade/damage
    "COMPLETE",    # Work finished and verified
    "FAILED",      # Abandoned or cancelled
}

# Strict transition matrix for direct manual/technician updates
VALID_MANUAL_TRANSITIONS = {
    "LOCKED":    {"READY"},
    "READY":     {"ACTIVE", "LOCKED"},
    "ACTIVE":    {"COMPLETE", "BLOCKED", "FAILED"},
    "BLOCKED":   {"ACTIVE", "FAILED"},
    "COMPLETE":  {"REGRESSED"},
    "REGRESSED": {"ACTIVE"},
    "FAILED":    set(),
}

@dataclass
class TaskPriority:
    task_id: str
    score: float
    critical_path_len: int
    days_to_deadline: Union[float, None]
    hours_blocked: float
    failure_category: Union[str, None]


class SyncFieldDAG:
    def __init__(self, tasks_definition: List[dict]):
        self.tasks: Dict[str, dict] = {t["task_id"]: t for t in tasks_definition}
        self._precondition_hooks: Dict[str, List[Callable[[dict], bool]]] = {}

        for task in self.tasks.values():
            task.setdefault("state", "LOCKED")
            task.setdefault("attempt_count", 0)
            task.setdefault("failure_category", None)
            task.setdefault("assigned_to", None)
            task.setdefault("scheduled_start", None)
            task.setdefault("created_at_epoch", datetime.now().timestamp())

        self.children_map: Dict[str, List[str]] = {t_id: [] for t_id in self.tasks}
        for t_id, task in self.tasks.items():
            for dep in task.get("dependencies", []):
                if dep in self.children_map:
                    self.children_map[dep].append(t_id)

        self.evaluate_graph()

    def get_descendants(self, start_node_id: str) -> Set[str]:
        """Traverses downstream nodes using BFS to find all affected children."""
        descendants = set()
        queue = [start_node_id]
        while queue:
            current = queue.pop(0)
            for child in self.children_map.get(current, []):
                if child not in descendants:
                    descendants.add(child)
                    queue.append(child)
        return descendants

    def get_affected_technicians(self, blocked_task_id: str) -> List[dict]:
        """Identifies every technician whose assigned work is downstream from a blocked node."""
        descendants = self.get_descendants(blocked_task_id)
        affected = []

        for t_id in descendants:
            task = self.tasks[t_id]
            if task.get("assigned_to"):
                affected.append({
                    "technician_id": task["assigned_to"],
                    "task_id": t_id,
                    "impact": "downstream_block",
                    "original_eta": task.get("scheduled_start")
                })

        direct_task = self.tasks.get(blocked_task_id)
        if direct_task and direct_task.get("assigned_to"):
            affected.append({
                "technician_id": direct_task["assigned_to"],
                "task_id": blocked_task_id,
                "impact": "direct_block",
                "original_eta": direct_task.get("scheduled_start")
            })

        return affected

    def register_precondition_hook(self, task_id: str, hook: Callable[[dict], bool]) -> None:
        """Injects domain rules (e.g., inventory, site safety) into the generic engine."""
        if task_id not in self._precondition_hooks:
            self._precondition_hooks[task_id] = []
        self._precondition_hooks[task_id].append(hook)

    def evaluate_graph(self) -> List[dict]:
        """
        Maintains structural integrity by checking dependency states and hooks.
        System cascades bypass the manual transition rules to enforce physical constraints.
        """
        changes = []
        for t_id, task in self.tasks.items():
            current_state = task["state"]

            dependencies_met = all(
                self.tasks[dep]["state"] == "COMPLETE"
                for dep in task.get("dependencies", [])
            )

            hooks_passed = all(
                hook(task) for hook in self._precondition_hooks.get(t_id, [])
            )

            if dependencies_met and hooks_passed:
                if current_state == "LOCKED":
                    task["state"] = "READY"
                    changes.append({
                        "task_id": t_id,
                        "old_state": "LOCKED",
                        "new_state": "READY",
                        "reason": "Dependencies and preconditions met"
                    })
            else:
                if current_state in ["READY", "ACTIVE"]:
                    task["state"] = "LOCKED"
                    changes.append({
                        "task_id": t_id,
                        "old_state": current_state,
                        "new_state": "LOCKED",
                        "reason": "Prerequisites/preconditions no longer met"
                    })
                elif current_state == "COMPLETE":
                    task["state"] = "REGRESSED"
                    changes.append({
                        "task_id": t_id,
                        "old_state": "COMPLETE",
                        "new_state": "REGRESSED",
                        "reason": "Upstream dependency failed"
                    })

        if changes:
            changes.extend(self.evaluate_graph())

        return changes

    def update_task_state(self, task_id: str, new_state: str, context: str = "") -> List[dict]:
        """Updates a single task state manually while enforcing manual transition rules."""
        if task_id not in self.tasks:
            raise ValueError(f"Task {task_id} not found.")
        if new_state not in VALID_STATES:
            raise ValueError(f"Invalid state: {new_state}")

        old_state = self.tasks[task_id]["state"]
        if old_state == new_state:
            return []

        if new_state not in VALID_MANUAL_TRANSITIONS.get(old_state, set()):
            raise ValueError(f"Illegal manual transition: {old_state} \u2192 {new_state} for task {task_id}")

        self.tasks[task_id]["state"] = new_state

        if new_state == "COMPLETE":
            self.tasks[task_id]["attempt_count"] = 0
            self.tasks[task_id]["failure_category"] = None

        if new_state == "BLOCKED":
            self.tasks[task_id]["blocked_since"] = datetime.now()
        elif old_state == "BLOCKED" and "blocked_since" in self.tasks[task_id]:
            del self.tasks[task_id]["blocked_since"]

        print(f"\n\u26a1 State Transition: [{task_id}] manually updated {old_state} \u279e {new_state} ({context})")

        events = [{"task_id": task_id, "old_state": old_state, "new_state": new_state, "reason": "Manual operator update"}]
        cascade_events = self.evaluate_graph()
        events.extend(cascade_events)

        return events

    def compute_priority(self, task_id: str) -> TaskPriority:
        """Calculates a multi-factor priority score to guide allocation decisions."""
        task = self.tasks[task_id]
        score = 0.0

        # Factor 1: Critical path length
        descendants = self.get_descendants(task_id)
        critical_path_score = len(descendants) * 10.0
        score += critical_path_score

        # Factor 2: Time pressure / Deadline proximity
        deadline_score = 0.0
        days_left = None
        if "deadline" in task:
            days_left = (task["deadline"] - datetime.now()).total_seconds() / 86400.0
            deadline_score = max(0.0, (7.0 - days_left) * 5.0)
            score += deadline_score

        # Factor 3: Resource contention (shared tooling)
        contention_score = 8.0 if task.get("requires_shared_tool") else 0.0
        score += contention_score

        # Factor 4: Blocker age
        hours_blocked = 0.0
        blocker_score = 0.0
        if task["state"] == "BLOCKED" and "blocked_since" in task:
            hours_blocked = (datetime.now() - task["blocked_since"]).total_seconds() / 3600.0
            blocker_score = hours_blocked * 2.0
            score += blocker_score

        # Factor 5: Chronological tiebreaker
        tiebreaker = 1.0 / (task.get("created_at_epoch", 1.0))
        score += tiebreaker

        # Factor 6: Failure category urgency weight
        category = task.get("failure_category")
        category_weight = CATEGORY_URGENCY_WEIGHT.get(category, 0.0) if category else 0.0
        score += category_weight

        return TaskPriority(
            task_id=task_id,
            score=round(score, 2),
            critical_path_len=len(descendants),
            days_to_deadline=round(days_left, 1) if days_left is not None else None,
            hours_blocked=round(hours_blocked, 1),
            failure_category=category,
        )

    def print_state(self):
        print("-" * 80)
        print(f"{'ID':<5} | {'Task Name':<38} | {'State':<12} | {'Priority Score'}")
        print("-" * 80)
        for t_id, task in self.tasks.items():
            p = self.compute_priority(t_id)
            print(f"{t_id:<5} | {task['task_name']:<38} | {task['state']:<12} | {p.score} (Blocker hr: {p.hours_blocked})")
        print("-" * 80)


class FieldOpsDomainRules:
    @staticmethod
    def find_failure_category(failure_type: str) -> str:
        for category, types in FAILURE_CATEGORIES.items():
            if failure_type in types:
                return category
        raise ValueError(f"Unknown failure type: {failure_type}")

    @classmethod
    def handle_task_failure(cls, engine: SyncFieldDAG, task_id: str, failure_type: str, technician_id: str) -> dict:
        task = engine.tasks[task_id]
        category = cls.find_failure_category(failure_type)
        task["failure_category"] = category
        task["attempt_count"] += 1

        attempt = task["attempt_count"]

        if category == "TECHNICAL" and attempt < 2:
            engine.update_task_state(task_id, "BLOCKED", f"Local retry {attempt} for {failure_type}")
            return {
                "action": "RETRY_LOCAL",
                "assignee": technician_id,
                "msg": f"Technical issue ({failure_type}). Retrying task locally. Attempt {attempt}/2."
            }
        else:
            target_role = CATEGORY_TO_ROLE[category]
            engine.update_task_state(task_id, "BLOCKED", f"Escalated to {target_role} due to {failure_type}")

            affected_techs = engine.get_affected_technicians(task_id)

            return {
                "action": "ESCALATE",
                "assigned_to": technician_id,
                "escalate_to_role": target_role,
                "affected_technicians": affected_techs,
                "msg": f"Escalated {failure_type} to {target_role}. Blocked downstream path contains {len(affected_techs)} staff."
            }
