# backend/tests/test_template_guesser.py

import unittest
from backend.workflow.template_guesser import TemplateGuesser, GuessedTask, GuessedDependency
from backend.tests.fake_supabase import FakeSupabaseClient


class TestTemplateGuesser(unittest.TestCase):

    def test_cold_start_empty_db(self):
        fake_client = FakeSupabaseClient(dataset=[])
        guesser = TemplateGuesser(fake_client)

        new_names = ["Site Survey", "Conduit", "Cable Run"]
        guesses = guesser.guess_template(new_names)

        self.assertEqual(len(guesses), 3)
        for name in new_names:
            self.assertTrue(guesses[name].guessed)
            self.assertEqual(guesses[name].suggested_dependencies, [])

    def test_confidence_calculations(self):
        history = [
            {
                "id": "1_01",
                "project_id": "P1",
                "task_name": "Survey",
                "dependencies": [],
            },
            {
                "id": "1_02",
                "project_id": "P1",
                "task_name": "Conduit",
                "dependencies": ["1_01"],
            },
            {
                "id": "2_01",
                "project_id": "P2",
                "task_name": "Survey",
                "dependencies": [],
            },
            {
                "id": "2_02",
                "project_id": "P2",
                "task_name": "Conduit",
                "dependencies": ["2_01"],
            },
            {
                "id": "3_01",
                "project_id": "P3",
                "task_name": "Survey",
                "dependencies": [],
            },
        ]

        fake_client = FakeSupabaseClient(dataset=history)
        guesser = TemplateGuesser(fake_client)

        target_nodes = ["Survey", "Conduit"]
        guesses = guesser.guess_template(target_nodes)

        conduit_guesses = guesses["Conduit"].suggested_dependencies
        self.assertEqual(len(conduit_guesses), 1)
        self.assertEqual(conduit_guesses[0].parent_name, "Survey")
        self.assertEqual(conduit_guesses[0].confidence, 1.0)

        survey_guesses = guesses["Survey"].suggested_dependencies
        self.assertEqual(len(survey_guesses), 0)

    def test_remap_and_instantiation(self):
        guesses_raw = {
            "Survey": GuessedTask(
                task_name="Survey",
                suggested_dependencies=[],
                guessed=False,
            ),
            "Conduit": GuessedTask(
                task_name="Conduit",
                suggested_dependencies=[
                    GuessedDependency(
                        parent_name="Survey",
                        confidence=1.0,
                        evidence="Historical match",
                    )
                ],
                guessed=False,
            ),
        }

        instantiated = TemplateGuesser.instantiate(
            guesses=guesses_raw,
            project_id="proj_site_b",
            site_prefix="siteB",
            confidence_threshold=0.5,
        )

        self.assertEqual(len(instantiated), 2)

        survey_record = next(t for t in instantiated if t["task_name"] == "Survey")
        conduit_record = next(t for t in instantiated if t["task_name"] == "Conduit")

        self.assertEqual(survey_record["task_id"], "siteB_T02")
        self.assertEqual(conduit_record["task_id"], "siteB_T01")

        self.assertEqual(conduit_record["dependencies"], ["siteB_T02"])
        self.assertEqual(survey_record["dependencies"], [])


if __name__ == "__main__":
    unittest.main()
