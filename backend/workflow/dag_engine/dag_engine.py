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

@dataclass
class FailurePolicy:
    category: str
    escalate_to_role: str
    max_local_retries: int = 0
    urgency_weight: float = 5.0


DEFAULT_POLICIES: dict[str, FailurePolicy] = {
    "RESOURCE":  FailurePolicy("RESOURCE",  "procurement_lead",   max_local_retries=0, urgency_weight=8.0),
    "SITE":      FailurePolicy("SITE",      "project_manager",    max_local_retries=0, urgency_weight=10.0),
    "TECHNICAL": FailurePolicy("TECHNICAL", "network_specialist", max_local_retries=1, urgency_weight=15.0),
    "QUALITY":   FailurePolicy("QUALITY",   "site_supervisor",    max_local_retries=0, urgency_weight=5.0),
}


@dataclass
class AvailabilityWindow:
    start: datetime
    end: datetime
    source: str
    confirmed: bool = True


class TechnicianSchedule:
    def __init__(self, windows: List[AvailabilityWindow]):
        self.windows = sorted(windows, key=lambda w: w.start)

    def next_available_slot(self, after: datetime, duration: timedelta) -> tuple:
        for w in self.windows:
            if w.end <= after:
                continue
            slot_start = max(after, w.start)
            if slot_start + duration <= w.end:
                confidence = "EXACT" if w.confirmed else "ESTIMATED"
                return slot_start, confidence
        return None, "UNKNOWN"

    def remove_window(self, start: datetime, end: datetime, source: str = "unavailable") -> None:
        new_windows = []
        for w in self.windows:
            if w.end <= start or w.start >= end:
                new_windows.append(w)
            else:
                if w.start < start:
                    new_windows.append(AvailabilityWindow(w.start, start, w.source, w.confirmed))
                if w.end > end:
                    new_windows.append(AvailabilityWindow(end, w.end, w.source, w.confirmed))
        self.windows = sorted(new_windows, key=lambda w: w.start)

    def delay_from(self, when: datetime, by: timedelta, confirmed: bool = False) -> None:
        new_windows = []
        for w in self.windows:
            if w.start >= when:
                new_windows.append(AvailabilityWindow(w.start + by, w.end + by, w.source, confirmed))
            else:
                new_windows.append(w)
        self.windows = new_windows

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

MAX_CASCADE_DEPTH = 20

@dataclass
class TaskPriority:
    task_id: str
    score: float
    critical_path_len: int
    days_to_deadline: Union[float, None]
    hours_blocked: float
    failure_category: Union[str, None]
    granularity: str = "ESTIMATE"
    data_sources_used: List[str] = None

    def __post_init__(self):
        if self.data_sources_used is None:
            self.data_sources_used = []


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
            task.setdefault("resolution_eta", None)
            task.setdefault("earliest_start", None)
            task.setdefault("eta_confidence", "UNKNOWN")

        self.children_map: Dict[str, List[str]] = {t_id: [] for t_id in self.tasks}
        for t_id, task in self.tasks.items():
            for dep in task.get("dependencies", []):
                if dep in self.children_map:
                    self.children_map[dep].append(t_id)

        self._detect_cycles()

        self.evaluate_graph()

    def _detect_cycles(self) -> None:
        visited: set = set()
        rec_stack: set = set()

        def dfs(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)
            for child in self.children_map.get(node, []):
                if child not in visited:
                    if dfs(child):
                        return True
                elif child in rec_stack:
                    return True
            rec_stack.discard(node)
            return False

        for t_id in self.tasks:
            if t_id not in visited:
                if dfs(t_id):
                    raise ValueError(f"Cycle detected in DAG — construction aborted")

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
    def compute_cascade_eta(self, blocked_task_id: str, schedules: dict = None) -> dict:
        """
        Propagates time impact downstream from a blocked node.
        Confidence degrades: EXACT → ESTIMATED → UNKNOWN.
        Optionally consults technician schedules for realistic start times.
        """
        descendants = self.get_descendants(blocked_task_id)
        order = [blocked_task_id]
        queue = [blocked_task_id]
        while queue:
            current = queue.pop(0)
            for child in self.children_map.get(current, []):
                if child in descendants and child not in order:
                    order.append(child)
                    queue.append(child)

        results: dict = {}

        for t_id in order:
            task = self.tasks[t_id]
            deps = task.get("dependencies", [])
            duration = timedelta(hours=task.get("estimated_duration_hours", 2))

            if t_id == blocked_task_id:
                if task.get("resolution_eta"):
                    results[t_id] = {
                        "earliest_start": task["resolution_eta"],
                        "earliest_finish": task["resolution_eta"] + duration,
                        "eta_confidence": task.get("eta_confidence", "EXACT"),
                    }
                    task["earliest_start"] = task["resolution_eta"]
                    task["eta_confidence"] = task.get("eta_confidence", "EXACT")
                else:
                    results[t_id] = {
                        "earliest_start": None,
                        "earliest_finish": None,
                        "eta_confidence": "UNKNOWN",
                        "reason": "Blocked task has no resolution ETA",
                    }
                    task["earliest_start"] = None
                    task["eta_confidence"] = "UNKNOWN"
                continue

            upstream_etas: list = []
            for dep in deps:
                dep_task = self.tasks[dep]
                if dep_task["state"] == "COMPLETE":
                    upstream_etas.append(("EXACT", datetime.min))
                elif dep_task.get("resolution_eta"):
                    dep_duration = dep_task.get("estimated_duration_hours", 2)
                    dep_finish = dep_task["resolution_eta"] + timedelta(hours=dep_duration)
                    upstream_etas.append((
                        dep_task.get("eta_confidence", "ESTIMATED"),
                        dep_finish,
                    ))
                else:
                    upstream_etas.append(("UNKNOWN", None))

            any_unknown = any(conf == "UNKNOWN" for conf, _ in upstream_etas) if upstream_etas else False
            any_estimated = any(conf == "ESTIMATED" for conf, _ in upstream_etas) if upstream_etas else False

            if any_unknown or not upstream_etas:
                results[t_id] = {
                    "earliest_start": None,
                    "earliest_finish": None,
                    "eta_confidence": "UNKNOWN",
                    "reason": "Upstream resolution time not available" if any_unknown else "No dependency data",
                }
                task["earliest_start"] = None
                task["eta_confidence"] = "UNKNOWN"
                continue

            latest_upstream = max(eta for _, eta in upstream_etas if eta is not None)
            assigned_tech = task.get("assigned_to")

            if schedules and assigned_tech and assigned_tech in schedules:
                slot_start, slot_conf = schedules[assigned_tech].next_available_slot(latest_upstream, duration)
                if slot_start is None:
                    results[t_id] = {
                        "earliest_start": None,
                        "earliest_finish": None,
                        "eta_confidence": "UNKNOWN",
                        "reason": f"{assigned_tech} has no available slot for {duration} from {latest_upstream}",
                    }
                    task["earliest_start"] = None
                    task["eta_confidence"] = "UNKNOWN"
                    continue
                earliest_start = slot_start
                effective_estimated = any_estimated or slot_conf == "ESTIMATED"
            else:
                earliest_start = latest_upstream
                effective_estimated = any_estimated

            earliest_finish = earliest_start + duration
            confidence = "ESTIMATED" if effective_estimated else "EXACT"

            results[t_id] = {
                "earliest_start": earliest_start,
                "earliest_finish": earliest_finish,
                "eta_confidence": confidence,
            }
            task["earliest_start"] = earliest_start
            task["eta_confidence"] = confidence
            task["resolution_eta"] = earliest_start

        return results

    def register_precondition_hook(self, task_id: str, hook: Callable[[dict], bool]) -> None:
        """Injects domain rules (e.g., inventory, site safety) into the generic engine."""
        if task_id not in self._precondition_hooks:
            self._precondition_hooks[task_id] = []
        self._precondition_hooks[task_id].append(hook)

    def evaluate_graph(self, depth: int = 0, dirty: set = None) -> List[dict]:
        """
        Maintains structural integrity by checking dependency states and hooks.
        System cascades bypass the manual transition rules to enforce physical constraints.
        Only READY tasks are re-locked — ACTIVE/BLOCKED/REGRESSED are protected.
        """
        if depth >= MAX_CASCADE_DEPTH:
            return []

        candidates = dirty if dirty is not None else self.tasks.keys()
        changes = []
        next_dirty = set()

        for t_id in candidates:
            task = self.tasks[t_id]
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
                        "depth": depth,
                        "reason": "Dependencies and preconditions met"
                    })
                    next_dirty.update(self.children_map.get(t_id, []))
            else:
                if current_state == "READY":
                    task["state"] = "LOCKED"
                    changes.append({
                        "task_id": t_id,
                        "old_state": "READY",
                        "new_state": "LOCKED",
                        "depth": depth,
                        "reason": "Prerequisites/preconditions no longer met"
                    })
                    next_dirty.update(self.children_map.get(t_id, []))
                elif current_state == "BLOCKED":
                    task["state"] = "LOCKED"
                    if "blocked_since" in task:
                        del task["blocked_since"]
                    changes.append({
                        "task_id": t_id,
                        "old_state": "BLOCKED",
                        "new_state": "LOCKED",
                        "depth": depth,
                        "reason": "Prerequisites no longer met — cleared block"
                    })
                    next_dirty.update(self.children_map.get(t_id, []))
                elif current_state == "COMPLETE":
                    task["state"] = "REGRESSED"
                    changes.append({
                        "task_id": t_id,
                        "old_state": "COMPLETE",
                        "new_state": "REGRESSED",
                        "depth": depth,
                        "reason": "Upstream dependency failed"
                    })
                    next_dirty.update(self.children_map.get(t_id, []))

        if changes:
            changes.extend(self.evaluate_graph(depth + 1, dirty=next_dirty))

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

        events = [{"task_id": task_id, "old_state": old_state, "new_state": new_state, "depth": 0, "reason": context or "Manual operator update"}]
        cascade_events = self.evaluate_graph(depth=0)
        events.extend(cascade_events)

        return events

    def compute_priority(self, task_id: str) -> TaskPriority:
        """Calculates a multi-factor priority score to guide allocation decisions."""
        task = self.tasks[task_id]
        score = 0.0
        data_sources: List[str] = []

        # Factor 1: Critical path length
        descendants = self.get_descendants(task_id)
        critical_path_score = len(descendants) * 10.0
        score += critical_path_score
        data_sources.append("dag_topology")

        # Factor 2: Time pressure / Deadline proximity
        deadline_score = 0.0
        days_left = None
        if "deadline" in task:
            days_left = (task["deadline"] - datetime.now()).total_seconds() / 86400.0
            deadline_score = max(0.0, (7.0 - days_left) * 5.0)
            score += deadline_score
            data_sources.append("deadline")

        # Factor 3: Resource contention (shared tooling)
        contention_score = 8.0 if task.get("requires_shared_tool") else 0.0
        score += contention_score
        if task.get("requires_shared_tool"):
            data_sources.append("inventory")

        # Factor 4: Blocker age
        hours_blocked = 0.0
        blocker_score = 0.0
        if task["state"] == "BLOCKED" and "blocked_since" in task:
            hours_blocked = (datetime.now() - task["blocked_since"]).total_seconds() / 3600.0
            blocker_score = hours_blocked * 2.0
            score += blocker_score
            data_sources.append("blocked_since")

        # Factor 5: Chronological tiebreaker
        tiebreaker = 1.0 / (task.get("created_at_epoch", 1.0))
        score += tiebreaker
        data_sources.append("created_at")

        # Factor 6: Failure category urgency weight
        category = task.get("failure_category")
        category_weight = DEFAULT_POLICIES[category].urgency_weight if category and category in DEFAULT_POLICIES else 0.0
        score += category_weight
        if category:
            data_sources.append("failure_category")

        granularity = "DETAILED" if "deadline" in task and "estimated_duration_hours" in task else "ESTIMATE"

        return TaskPriority(
            task_id=task_id,
            score=round(score, 2),
            critical_path_len=len(descendants),
            days_to_deadline=round(days_left, 1) if days_left is not None else None,
            hours_blocked=round(hours_blocked, 1),
            failure_category=category,
            granularity=granularity,
            data_sources_used=data_sources,
        )

    def print_state(self):
        print("-" * 80)
        print(f"{'ID':<5} | {'Task Name':<38} | {'State':<12} | {'Priority Score'}")
        print("-" * 80)
        for t_id, task in self.tasks.items():
            p = self.compute_priority(t_id)
            print(f"{t_id:<5} | {task['task_name']:<38} | {task['state']:<12} | {p.score} (Blocker hr: {p.hours_blocked})")
        print("-" * 80)

    def sync_to_supabase(self, events: List[dict], sb_client) -> None:
        if not events:
            return

        seen_tasks: dict = {}
        for event in events:
            seen_tasks[event["task_id"]] = event

        task_upserts = []
        for task_id, event in seen_tasks.items():
            task = self.tasks[task_id]
            earliest = task.get("earliest_start")
            task_upserts.append({
                "id": task_id,
                "state": event["new_state"],
                "failure_category": task.get("failure_category"),
                "attempt_count": task.get("attempt_count", 0),
                "earliest_start": earliest.isoformat() if earliest else None,
                "eta_confidence": task.get("eta_confidence", "UNKNOWN"),
                "updated_at": "now()",
            })

        event_inserts = [{
            "task_id": e["task_id"],
            "old_state": e["old_state"],
            "new_state": e["new_state"],
            "reason": e["reason"],
            "triggered_by": self._triggered_by(e),
            "depth": e.get("depth", 0),
        } for e in events]

        if task_upserts:
            sb_client.table("tasks").upsert(task_upserts).execute()
        if event_inserts:
            sb_client.table("task_events").insert(event_inserts).execute()

    @staticmethod
    def _triggered_by(event: dict) -> str:
        reason = event.get("reason", "")
        if "Dependencies and preconditions met" in reason:
            return "system"
        if reason == "Manual operator update":
            return "manual"
        return "cascade"


class FieldOpsDomainRules:
    def __init__(self, policies: dict[str, FailurePolicy] = None):
        self.policies = policies or DEFAULT_POLICIES

    @staticmethod
    def find_failure_category(failure_type: str) -> str:
        for category, types in FAILURE_CATEGORIES.items():
            if failure_type in types:
                return category
        raise ValueError(f"Unknown failure type: {failure_type}")

    def handle_task_failure(self, engine: SyncFieldDAG, task_id: str, failure_type: str, technician_id: str) -> dict:
        task = engine.tasks[task_id]

        if task["state"] == "FAILED":
            return {
                "action": "ALREADY_FAILED",
                "assignee": technician_id,
                "msg": f"Task {task_id} is already FAILED — ignoring late failure report."
            }

        category = self.find_failure_category(failure_type)
        policy = self.policies.get(category)
        if not policy:
            raise ValueError(f"No policy for failure category: {category}")

        task["failure_category"] = category
        task["attempt_count"] += 1
        attempt = task["attempt_count"]

        if attempt <= policy.max_local_retries:
            engine.update_task_state(task_id, "BLOCKED", f"Local retry {attempt}/{policy.max_local_retries} for {failure_type}")
            return {
                "action": "RETRY_LOCAL",
                "assignee": technician_id,
                "msg": f"Technical issue ({failure_type}). Retrying task locally. Attempt {attempt}/{policy.max_local_retries}."
            }
        else:
            engine.update_task_state(task_id, "BLOCKED", f"Escalated to {policy.escalate_to_role} due to {failure_type}")
            affected_techs = engine.get_affected_technicians(task_id)
            return {
                "action": "ESCALATE",
                "assigned_to": technician_id,
                "escalate_to_role": policy.escalate_to_role,
                "affected_technicians": affected_techs,
                "msg": f"Escalated {failure_type} to {policy.escalate_to_role}. Blocked downstream path contains {len(affected_techs)} staff."
            }
