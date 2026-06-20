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


def main():
    print("\n" + "#" * 70)
    print("# SYNCFIELD REAL-WORLD TEST SUITE")
    print("#" * 70)

    parser_result = test_parser_realworld.run()
    cache_ok = test_parser_realworld.test_cache_set_arity_directly()

    sim_result = test_simulation_realworld.run()

    print("\n" + "#" * 70)
    print("# FINAL SUMMARY")
    print("#" * 70)
    print(f"Parser crashes:                {len(parser_result['crashes'])}")
    print(f"resolution_cache.set() arity:  {'OK' if cache_ok else 'BUG CONFIRMED'}")
    print(f"All-COMPLETE ETA bug:          {'BUG CONFIRMED' if sim_result['bug_reproduced'] else 'OK / fixed'}")

    failed = bool(parser_result["crashes"]) or not cache_ok or sim_result["bug_reproduced"]
    if failed:
        print("\nResult: ISSUES FOUND — see details above.")
        sys.exit(1)
    else:
        print("\nResult: ALL CLEAR.")
        sys.exit(0)


if __name__ == "__main__":
    main()
