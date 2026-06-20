"""
Test 1 — Parser stress test against realistic message traffic.

Run: PYTHONPATH=. python -m backend.tests.test_parser_realworld
"""
import os
from backend.workflow.parser.parser import FieldOpsParser
from backend.tests.fixtures import REALISTIC_MESSAGE_LOG
from backend.tests.fake_cache import InMemoryResolutionCache


def run():
    print("=" * 70)
    print("TEST 1: Parser vs. realistic message log")
    print("=" * 70)

    os.environ.pop("LLM_API_KEY", None)

    cache = InMemoryResolutionCache()
    parser = FieldOpsParser(resolution_cache=cache)

    results = []
    crashes = []

    for msg in REALISTIC_MESSAGE_LOG:
        try:
            result = parser.parse(
                msg["text"], technician_id=msg["sender"], active_task_id=msg["active_task_id"]
            )
            results.append((msg, result))
        except Exception as e:
            crashes.append((msg, repr(e)))

    print(f"\n{'Sender':<26} {'Message':<45} {'Tier':<6} {'Task':<6} {'Failure':<18} {'Expect'}")
    print("-" * 70)
    mismatches = 0
    for msg, result in results:
        expected = msg["expect_tier"]
        actual_tier = result.tier if (result.task_id and result.failure_type) else None
        status = "OK" if actual_tier == expected else "MISMATCH"
        if status == "MISMATCH":
            mismatches += 1
        print(f"{msg['sender']:<26} {msg['text'][:43]:<45} "
              f"{str(result.tier):<6} {result.task_id or '-':<6} "
              f"{result.failure_type or '-':<18} expect={expected} [{status}]")

    print(f"\n{len(results)} messages processed, {mismatches} mismatches, {len(crashes)} crashes")

    if crashes:
        print("\n--- CRASHES (these are real defects, not test artifacts) ---")
        for msg, err in crashes:
            print(f"  Message: {msg['text']!r}")
            print(f"  Error:   {err}\n")

    return {"results": results, "crashes": crashes, "mismatches": mismatches}


def test_cache_set_arity_directly():
    print("\n" + "=" * 70)
    print("ISOLATED TEST: resolution_cache.set() arity check")
    print("=" * 70)

    os.environ.pop("LLM_API_KEY", None)

    from backend.workflow.parser.parser import ParseResult

    cache = InMemoryResolutionCache()
    parser = FieldOpsParser(resolution_cache=cache)

    def fake_call_llm(text, tech_id):
        return ParseResult(task_id="T03", failure_type="MATERIAL_MISSING",
                           technician_id=tech_id, tier=3, raw_input=text)

    parser._call_llm = fake_call_llm

    try:
        result = parser._tier3_llm("ok dah settle", "Ahmad_Wireman")
        print("No crash — cache.set() call succeeded.")
        print("Result:", result)
        return True
    except TypeError as e:
        print("CONFIRMED BUG: TypeError when caching a Tier 3 resolution.")
        print(f"  {e}")
        print("  Location: parser.py _tier3_llm() -> self.cache.set(key, resolved.failure_type)")
        print("  Fix: self.cache.set(key, resolved.failure_type, ...) needs the 3rd arg,")
        print("       or ResolutionCache.set()'s signature needs to change to match.")
        return False


if __name__ == "__main__":
    run()
    test_cache_set_arity_directly()
