"""
P1 — VRP solver boundary conditions, including the discarded reason string
from _is_eligible().

Run: PYTHONPATH=. python -m backend.tests.test_p1_vrp_boundaries
"""
from backend.optimization.vrp_solver.solver import VRPSolver


class FakeEngine:
    def __init__(self, tasks):
        self.tasks = tasks

    def compute_priority(self, task_id):
        class P:
            score = 10.0
        return P()


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def run_no_skill_match():
    section("P1 TEST 1: No technician has the required skill -> empty list, no crash")

    tasks = {
        "X01": {"state": "READY", "assigned_to": None, "required_skills": ["plumbing"],
                "estimated_duration_hours": 2},
    }
    engine = FakeEngine(tasks)
    technicians = {
        "Ahmad": {"skills": ["cabling"], "shift_end_hour": 18},
        "Ravi": {"skills": ["mounting"], "shift_end_hour": 18},
    }
    solver = VRPSolver(engine, technicians)
    result = solver.solve_reassignment(["Ahmad", "Ravi"], exclude_tasks=set())

    print(f"Result: {result}")
    ok = result == []
    print(f"\n>>> {'PASS' if ok else 'FAIL'}: Correctly returns empty list")
    return {"pass": ok}


def run_insufficient_inventory():
    section("P1 TEST 2: Inventory insufficient — check the ACTUAL reason string")

    tasks = {
        "X01": {"state": "READY", "assigned_to": None, "required_skills": ["cabling"],
                "required_materials_qty": {"cat6_drum": 2}, "estimated_duration_hours": 2},
    }
    engine = FakeEngine(tasks)
    technicians = {
        "Ahmad": {"skills": ["cabling"], "van_inventory": {"cat6_drum": 1}, "shift_end_hour": 18},
    }
    solver = VRPSolver(engine, technicians)

    eligible, reason = solver._is_eligible(technicians["Ahmad"], tasks["X01"], now_hour=9.0)
    print(f"_is_eligible() directly: eligible={eligible}, reason='{reason}'")

    expected_reason = "insufficient_cat6_drum: need 2, have 1"
    ok = reason == expected_reason
    print(f"\n>>> {'PASS' if ok else 'FAIL'}: Reason string matches expected format")
    print(f"    expected: '{expected_reason}'")
    print(f"    actual:   '{reason}'")

    result = solver.solve_reassignment(["Ahmad"], exclude_tasks=set())
    print(f"\nsolve_reassignment() result: {result}")
    print(">>> NOTE: solve_reassignment() gives no indication of WHY Ahmad was excluded.")

    return {"pass": ok}


def run_shift_overrun():
    section("P1 TEST 3: Shift time insufficient + boundary check")

    tasks = {
        "X01": {"state": "READY", "assigned_to": None, "required_skills": ["cabling"],
                "estimated_duration_hours": 2},
    }
    engine = FakeEngine(tasks)
    technicians = {
        "Lim_EndOfShift": {"skills": ["cabling"], "shift_end_hour": 10, "van_inventory": {}},
    }
    solver = VRPSolver(engine, technicians)

    eligible, reason = solver._is_eligible(technicians["Lim_EndOfShift"], tasks["X01"], now_hour=9.5)
    print(f"now_hour=9.5, duration=2h, shift_end=10 -> should be ineligible.")
    print(f"eligible={eligible}, reason='{reason}'")
    ok = eligible is False and "shift_overrun" in reason
    print(f"\n>>> {'PASS' if ok else 'FAIL'}: Correctly flagged as shift overrun")

    eligible2, reason2 = solver._is_eligible(technicians["Lim_EndOfShift"], tasks["X01"], now_hour=8.0)
    print(f"\nBoundary: now_hour=8.0, duration=2h, shift_end=10 -> exactly 10, should be eligible.")
    print(f"eligible={eligible2}, reason='{reason2}'")
    boundary_ok = eligible2 is True
    print(f">>> {'PASS' if boundary_ok else 'FAIL'}: Exact-fit boundary correctly allowed")

    return {"pass": ok and boundary_ok}


if __name__ == "__main__":
    r1 = run_no_skill_match()
    r2 = run_insufficient_inventory()
    r3 = run_shift_overrun()

    print("\n" + "#" * 70)
    all_pass = r1["pass"] and r2["pass"] and r3["pass"]
    print(f"P1 VRP BOUNDARY CONDITIONS: {'ALL PASS' if all_pass else 'FAILURES FOUND'}")
    print("#" * 70)
