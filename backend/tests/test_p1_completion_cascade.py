# backend/tests/test_p1_completion_cascade.py

import unittest
from backend.workflow.dag_engine.dag_engine import SyncFieldDAG
from backend.optimization.vrp_solver.solver import VRPSolver
from backend.integrations.notifications.stub import StubNotifier
from backend.workflow.event_handlers.dispatcher import FieldOpsDispatcher


class TestCompletionCascade(unittest.TestCase):

    def test_completion_cascades_and_reassigns(self):
        tasks = [
            {"task_id": "T03", "task_name": "Cabling", "dependencies": [], "state": "ACTIVE",
             "assigned_to": "Ahmad_Wireman", "estimated_duration_hours": 4, "lat": 3.12, "lng": 101.65},
            {"task_id": "T04", "task_name": "Mounting", "dependencies": ["T03"], "state": "LOCKED",
             "required_skills": ["mounting"], "estimated_duration_hours": 3, "lat": 3.12, "lng": 101.65},
            {"task_id": "T05", "task_name": "Networking", "dependencies": ["T03"], "state": "LOCKED",
             "required_skills": ["networking"], "estimated_duration_hours": 2, "lat": 3.12, "lng": 101.65},
        ]

        engine = SyncFieldDAG(tasks)

        technicians = {
            "Ravi_Mounting": {"skills": ["mounting"], "shift_end_hour": 18, "lat": 3.12, "lng": 101.65},
            "Zul_Net": {"skills": ["networking"], "shift_end_hour": 18, "lat": 3.12, "lng": 101.65},
        }

        solver = VRPSolver(engine, technicians)
        notifier = StubNotifier()
        dispatcher = FieldOpsDispatcher(engine, solver, notifier)

        result = dispatcher.process_completion_report("T03", "Ahmad_Wireman")

        self.assertEqual(engine.tasks["T03"]["state"], "COMPLETE")
        self.assertEqual(engine.tasks["T04"]["state"], "READY")
        self.assertEqual(engine.tasks["T05"]["state"], "READY")

        self.assertEqual(engine.tasks["T04"]["assigned_to"], "Ravi_Mounting")
        self.assertEqual(engine.tasks["T05"]["assigned_to"], "Zul_Net")
        self.assertEqual(len(result["new_assignments"]), 2)


if __name__ == "__main__":
    unittest.main()
