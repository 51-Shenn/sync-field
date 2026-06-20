"""
Run all real-world-style tests in one go.

Usage:
    PYTHONPATH=. python -m backend.tests.run_all_realworld

Exit code is non-zero if any crash or confirmed bug was found, so this
can be wired into a CI step or pre-commit hook later if desired.
"""
import sys

from backend.tests import test_parser_realworld
from backend.tests import test_simulation_realworld
from backend.tests import test_p0_regression_cascade
from backend.tests import test_p0_custom_policy
from backend.tests import test_p1_schedule_pipeline
from backend.tests import test_p1_vrp_boundaries
from backend.tests import test_p2_edge_cases


def main():
    print("\n" + "#" * 70)
    print("# SYNCFIELD REAL-WORLD TEST SUITE (FULL)")
    print("#" * 70)

    parser_result = test_parser_realworld.run()
    cache_ok = test_parser_realworld.test_cache_set_arity_directly()

    sim_result = test_simulation_realworld.run()

    p0_regress = test_p0_regression_cascade.run()
    p0_regress_partial = test_p0_regression_cascade.run_partial_regression()

    p0_policy = test_p0_custom_policy.run()
    p0_policy_role = test_p0_custom_policy.run_role_check()

    p1_window = test_p1_schedule_pipeline.run_basic_window_removal()
    p1_delay = test_p1_schedule_pipeline.run_delay_from()
    p1_eta = test_p1_schedule_pipeline.run_eta_with_real_schedule()

    p1_skill = test_p1_vrp_boundaries.run_no_skill_match()
    p1_inv = test_p1_vrp_boundaries.run_insufficient_inventory()
    p1_shift = test_p1_vrp_boundaries.run_shift_overrun()

    p2_cycle = test_p2_edge_cases.run_cyclic_dependency()
    p2_failed = test_p2_edge_cases.run_failed_task_reporting_failure()

    print("\n" + "#" * 70)
    print("# FINAL SUMMARY")
    print("#" * 70)
    print("--- Previously verified ---")
    print(f"Parser crashes:                {len(parser_result['crashes'])}")
    print(f"resolution_cache.set() arity:  {'OK' if cache_ok else 'BUG CONFIRMED'}")
    print(f"All-COMPLETE ETA bug:          {'BUG CONFIRMED' if sim_result['bug_reproduced'] else 'OK / fixed'}")
    print("--- P0 ---")
    print(f"Reverse cascade (COMPLETE->REGRESSED), multi-layer: {'PASS' if not p0_regress['failures'] else 'FAIL'}")
    print(f"Reverse cascade, partial multi-parent regression:   {'PASS' if p0_regress_partial['pass'] else 'FAIL'}")
    print(f"Custom FailurePolicy retry count honored:           {'PASS' if p0_policy['retries_ok'] else 'FAIL'}")
    print(f"Custom FailurePolicy escalation role honored:       {'PASS' if p0_policy_role['role_ok'] else 'FAIL'}")
    print("--- P1 ---")
    print(f"remove_window() excludes break correctly:           {'PASS' if p1_window['pass'] else 'FAIL'}")
    print(f"delay_from() shifts windows correctly:               {'PASS' if p1_delay['pass'] else 'FAIL'}")
    print(f"compute_cascade_eta() with real schedule:            {'PASS' if p1_eta['pass'] else 'FAIL'}")
    print(f"VRP: no skill match -> empty, no crash:              {'PASS' if p1_skill['pass'] else 'FAIL'}")
    print(f"VRP: insufficient inventory reason string correct:   {'PASS' if p1_inv['pass'] else 'FAIL'}")
    print(f"VRP: shift overrun + boundary correctly handled:     {'PASS' if p1_shift['pass'] else 'FAIL'}")
    print("--- P2 (documenting known gaps, not pass/fail) ---")
    print(f"2-node cycle correctly rejected at construction:   {'PASS' if p2_cycle['rejected'] else 'GAP'}")
    print(f"FAILED re-report no-ops with ALREADY_FAILED:       {'PASS' if p2_failed['guarded'] else 'GAP'}")

    failed = (
        bool(parser_result["crashes"]) or not cache_ok or sim_result["bug_reproduced"]
        or p0_regress["failures"] or not p0_regress_partial["pass"]
        or not p0_policy["retries_ok"] or not p0_policy_role["role_ok"]
        or not p1_window["pass"] or not p1_delay["pass"] or not p1_eta["pass"]
        or not p1_skill["pass"] or not p1_inv["pass"] or not p1_shift["pass"]
        or not p2_cycle["rejected"] or not p2_failed["guarded"]
    )

    if failed:
        print("\nResult: ISSUES FOUND — see details above.")
        sys.exit(1)
    else:
        print("\nResult: ALL VERIFIED BEHAVIOR PASSES.")
        print("Known gaps (documented, not crashing): cycle detection, FAILED re-report guard.")
        sys.exit(0)


if __name__ == "__main__":
    main()
