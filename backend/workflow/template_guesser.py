# backend/workflow/template_guesser.py

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Set


@dataclass
class GuessedDependency:
    parent_name: str
    confidence: float
    evidence: str


@dataclass
class GuessedTask:
    task_name: str
    suggested_dependencies: List[GuessedDependency] = field(default_factory=list)
    guessed: bool = False


class TemplateGuesser:
    def __init__(self, sb_client):
        self.sb = sb_client

    def guess_template(self, new_task_names: List[str]) -> Dict[str, GuessedTask]:
        if not new_task_names:
            return {}

        try:
            res = (
                self.sb.table("tasks")
                .select("project_id, task_name, id, dependencies")
                .execute()
            )
            raw_tasks = res.data or []
        except Exception:
            raw_tasks = []

        if not raw_tasks:
            return {
                name: GuessedTask(
                    task_name=name,
                    suggested_dependencies=[],
                    guessed=True,
                )
                for name in new_task_names
            }

        project_id_to_id_map: Dict[str, Dict[str, str]] = {}
        project_tasks: Dict[str, List[dict]] = {}

        for t in raw_tasks:
            pid = t.get("project_id")
            if not pid:
                continue
            project_id_to_id_map.setdefault(pid, {})[t["id"]] = t["task_name"]
            project_tasks.setdefault(pid, []).append(t)

        dep_counts: Dict[str, Dict[str, int]] = {}
        task_project_counts: Dict[str, int] = {}

        for pid, t_list in project_tasks.items():
            id_name_map = project_id_to_id_map[pid]
            seen_in_project: Set[str] = set()

            for t in t_list:
                b_name = t["task_name"]
                if b_name in seen_in_project:
                    continue
                seen_in_project.add(b_name)

                task_project_counts[b_name] = task_project_counts.get(b_name, 0) + 1

                deps = t.get("dependencies") or []
                for dep_id in deps:
                    parent_name = id_name_map.get(dep_id)
                    if parent_name:
                        if b_name not in dep_counts:
                            dep_counts[b_name] = {}
                        dep_counts[b_name][parent_name] = (
                            dep_counts[b_name].get(parent_name, 0) + 1
                        )

        guesses: Dict[str, GuessedTask] = {}
        for target_name in new_task_names:
            guessed_task = GuessedTask(task_name=target_name, guessed=False)
            total_b = task_project_counts.get(target_name, 0)

            if total_b == 0:
                guessed_task.guessed = True
                guesses[target_name] = guessed_task
                continue

            parents = dep_counts.get(target_name, {})
            for parent_name, count in parents.items():
                if parent_name not in new_task_names:
                    continue

                confidence = round(count / total_b, 2)
                guessed_task.suggested_dependencies.append(
                    GuessedDependency(
                        parent_name=parent_name,
                        confidence=confidence,
                        evidence=f"Seen in {count}/{total_b} historical projects",
                    )
                )

            guessed_task.suggested_dependencies.sort(
                key=lambda x: x.confidence, reverse=True
            )
            guesses[target_name] = guessed_task

        return guesses

    @staticmethod
    def instantiate(
        guesses: Dict[str, GuessedTask],
        project_id: str,
        site_prefix: str,
        confidence_threshold: float = 0.5,
        lat: float = 3.120,
        lng: float = 101.655,
    ) -> List[dict]:
        sorted_names = sorted(guesses.keys())
        name_to_prefixed_id: Dict[str, str] = {}
        for i, name in enumerate(sorted_names):
            name_to_prefixed_id[name] = f"{site_prefix}_T{i+1:02d}"

        instantiated: List[dict] = []
        base_time = datetime.now()

        for name, g_task in guesses.items():
            assigned_id = name_to_prefixed_id[name]
            resolved_deps: List[str] = []

            for dep in g_task.suggested_dependencies:
                if dep.confidence >= confidence_threshold:
                    parent_id = name_to_prefixed_id.get(dep.parent_name)
                    if parent_id and parent_id != assigned_id:
                        resolved_deps.append(parent_id)

            instantiated.append(
                {
                    "task_id": assigned_id,
                    "project_id": project_id,
                    "task_name": name,
                    "dependencies": sorted(resolved_deps),
                    "deadline": base_time + timedelta(days=7),
                    "lat": lat,
                    "lng": lng,
                    "estimated_duration_hours": 3,
                    "state": "LOCKED",
                    "attempt_count": 0,
                    "failure_category": None,
                    "assigned_to": None,
                }
            )

        return instantiated

    def save_template(self, name: str, description: str, guesses: Dict[str, GuessedTask]) -> dict:
        serialized_tasks = []
        for task_name, g_task in guesses.items():
            serialized_tasks.append({
                "task_name": task_name,
                "suggested_dependencies": [
                    {
                        "parent_name": dep.parent_name,
                        "confidence": dep.confidence,
                        "evidence": dep.evidence,
                    }
                    for dep in g_task.suggested_dependencies
                ],
                "guessed": g_task.guessed,
            })

        payload = {
            "name": name,
            "description": description,
            "tasks": serialized_tasks,
            "updated_at": "now()",
        }

        res = self.sb.table("project_templates").upsert(payload).execute()
        return res.data[0] if res.data else {}

    def load_template(self, name: str) -> Dict[str, GuessedTask]:
        res = self.sb.table("project_templates").select("tasks").eq("name", name).maybe_single().execute()
        if not res or not res.data:
            raise ValueError(f"Project template '{name}' not found.")

        raw_tasks = res.data.get("tasks", [])
        guesses: Dict[str, GuessedTask] = {}
        for t in raw_tasks:
            task_name = t["task_name"]
            guesses[task_name] = GuessedTask(
                task_name=task_name,
                suggested_dependencies=[
                    GuessedDependency(**dep)
                    for dep in t.get("suggested_dependencies", [])
                ],
                guessed=t.get("guessed", False),
            )
        return guesses
