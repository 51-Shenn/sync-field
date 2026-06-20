# SyncField DAG Architecture Reference

## Architecture

```
Parser (3-tier) → Domain Rules (FailurePolicy) → DAG Engine (cascade + cycle detect)
          ↓                                              ↓
  Resolution Cache                          Schedule Engine (ETA propagation)
                                                    ↓
                                            VRP Solver (CP-SAT)
                                              ↓       ↓
                                        Dispatcher   Supabase Realtime
```

## Module Map

| Module | File | Status |
|---|---|---|
| DAG Engine | `dag_engine/dag_engine.py` | ✅ Production — bidirectional, dirty-set, cycle detect |
| Domain Rules | `dag_engine/dag_engine.py` (FieldOpsDomainRules) | ✅ Production — instance-based, FailurePolicy injectable |
| Schedule Engine | `dag_engine/dag_engine.py` (TechnicianSchedule, compute_cascade_eta) | ✅ Implemented + tested |
| VRP Solver | `optimization/vrp_solver/solver.py` | ✅ Production — joint assignment, per-assignment scoring |
| Dispatcher | `event_handlers/dispatcher.py` | ✅ Production — ETA-aware, absence handling |
| Parser | `parser/parser.py` | ✅ Tier 1+2 prod, Tier 3 wired (north-mini-code-free) |
| Resolution Cache | `db/resolution_cache.py` | ✅ Production — SHA-256 exact-match |
| Supabase Client | `integrations/supabase/client.py` | ✅ Production — singleton factory |

## Bug Catalog

### BUG-1: Aggressive auto-lock protects ACTIVE/BLOCKED/REGRESSED from cascade eviction

**Fixed**: `evaluate_graph()` only re-locks `READY` tasks. Running tasks are protected.

### BUG-2: Conditional `assigned_to` clearing

**Fixed**: Only clear `assigned_to` if the technician was successfully reassigned.

### BUG-3: Per-assignment score not solver.ObjectiveValue()

**Fixed**: `Assignment.score` computed per assignment as `priority − distance_penalty`.

### BUG-4: Depth threading through recursion

**Fixed**: `evaluate_graph(depth)` passes depth, events include `depth`, `MAX_CASCADE_DEPTH=20`.

### BUG-5: All-COMPLETE dependency set resolves to false UNKNOWN

**Fixed**: COMPLETE deps tracked with `datetime.min` (zero-impact timestamp). See ETA Propagation section.

### BUG-6: `cache.set()` arity mismatch in Tier 3

**Fixed**: Parser now calls `cache.set(key, task_id, failure_type)` — 3 args matching `ResolutionCache.set()`.

### BUG-7: Cache hit key mismatch (`task_id` vs `resolved_state`)

**Fixed**: Parser reads `cached.get("resolved_state")` and `cached.get("resolved_failure_type")` matching DB schema.

### BUG-8: Cycle dependency → silent deadlock

**Fixed**: `_detect_cycles()` DFS at DAG construction raises `ValueError` on any circular dependency. O(V+E).

### BUG-9: FAILED task re-report raises ValueError

**Fixed**: `handle_task_failure()` returns `ALREADY_FAILED` action when called on a terminal-state task.

## Optimization Catalog

### OPT-1: Circuit breaker

Depth guard at `MAX_CASCADE_DEPTH=20`. Returns empty list at limit.

### OPT-2: CP-SAT solver with 2s timeout

OR-Tools constraint solver: hard (skills, inventory, shift) + soft (priority − distance).

### OPT-3: Joint reassignment (not sequential)

All displaced technicians assigned simultaneously in one solve call.

### OPT-4: BFS descendant traversal

`get_descendants()` uses BFS from `children_map` for O(V+E).

### OPT-5: Data completeness tracking

`TaskPriority` includes `granularity` (DETAILED/ESTIMATE) and `data_sources_used`.

### OPT-6: Exclusion set (not in-place removal)

`solve_reassignment()` takes `exclude_tasks: Set[str]` without mutating DAG.

### OPT-7: Dirty-set cascade evaluation

`evaluate_graph()` only re-checks children of nodes that changed — O(changed × depth), not O(N × depth).

### OPT-8: Batch Supabase sync

`sync_to_supabase()` uses 2 calls (1 upsert, 1 insert) regardless of cascade depth. No `time.sleep`.

### OPT-9: Cycle detection at construction

DFS-based `_detect_cycles()` — O(V+E), immediately errors on circular deps.

### OPT-13: SHA-256 resolution cache

Exact-match hash on normalized `message|context` — no vector DB needed.

## Schedule Engine & ETA Propagation

### TechnicianSchedule

Per-technician schedule as sorted list of `AvailabilityWindow` objects:
- **`next_available_slot(after, duration)`** — finds first fitting gap, returns confidence (EXACT/ESTIMATED)
- **`remove_window()`** — carves out a break/unavailability (e.g. lunch, traffic)
- **`delay_from()`** — shifts all windows after a delay point (e.g. accident, late arrival)

### compute_cascade_eta(blocked_task_id, schedules=None)

Propagates time impact downstream in BFS topological order. Confidence degrades through the chain:
- All upstreams EXACT → EXACT
- Any upstream ESTIMATED → ESTIMATED
- Any upstream UNKNOWN → UNKNOWN

COMPLETE dependencies contribute `datetime.min` — zero timing impact, EXACT confidence, no constraint on `earliest_start`. Optional `schedules` parameter consults real technician availability windows.

### Confidence-Aware Notifications

```
EXACT:      "T04 unblocked. Earliest start: 21 Jun 13:00."
ESTIMATED:  "T04 blocked. Estimated start: ~21 Jun 13:00 (approx)."
UNKNOWN:    "T04 blocked. Cannot estimate start — awaiting upstream resolution."
```

## Failure Policy — Configurable Routing

```python
@dataclass
class FailurePolicy:
    category: str
    escalate_to_role: str
    max_local_retries: int = 0
    urgency_weight: float = 5.0

DEFAULT_POLICIES = {
    "RESOURCE":  FailurePolicy("RESOURCE",  "procurement_lead",   max_local_retries=0, urgency_weight=8.0),
    "SITE":      FailurePolicy("SITE",      "project_manager",    max_local_retries=0, urgency_weight=10.0),
    "TECHNICAL": FailurePolicy("TECHNICAL", "network_specialist", max_local_retries=1, urgency_weight=15.0),
    "QUALITY":   FailurePolicy("QUALITY",   "site_supervisor",    max_local_retries=0, urgency_weight=5.0),
}
```

`FieldOpsDispatcher.__init__` accepts `policies` parameter — adding a category or changing retry thresholds is configuration, not code change.

## Parser Tier Architecture

| Tier | Method | Coverage | Cost |
|---|---|---|---|
| 1 | Structured (JSON + Command) | ~60% | $0 |
| 2 | Keyword/Regex + `active_task_id` fallback | ~25% | $0 |
| 3 | LLM (OpenAI-compatible) + SHA-256 cache | ~15% | ~$0 (free model) |

### Manglish Coverage (Tier 2)

| Malay Signal | English Signal | Failure Type |
|---|---|---|
| `tak cukup`, `habis`, `stok kosong` | `short of`, `out of stock` | MATERIAL_MISSING |
| `patah`, `rosak`, `tak boleh pakai` | `broken`, `not working` | TOOL_DAMAGED |
| `koyak` | `torn`, `ruined` | TOOL_MISSING |
| `tiada letrik`, `power tak ready` | `no power`, `blackout` | NO_POWER |
| `tempat belum siap`, `tidak dapat akses` | `site locked`, `access denied` | SITE_NOT_READY / ACCESS_DENIED |
| `blank`, `no pulse`, `pin fail` | `blank`, `no signal` | TEST_FAILED |
| `takleh login`, `ip crash` | `cannot login`, `ip conflict` | IP_CONFLICT |
| `blur` | `blurry` | BLUR |

## Test Coverage

| Module | Tests | What it covers |
|---|---|---|
| `test_dag_scenarios.py` | 5 scenarios, 25+ assertions | Material cascade, tech retry, absence, parser, ETA |
| `test_parser_realworld.py` | 14 messages + cache arity | Tier 1/2/3 routing, Manglish, noise filtering |
| `test_simulation_realworld.py` | 4-phase E2E | Incomplete data, cascade, absence, all-COMPLETE ETA |
| `test_p0_regression_cascade.py` | 2 tests | COMPLETE→REGRESSED multi-layer + partial parent |
| `test_p0_custom_policy.py` | 2 tests | Custom retry count + escalation role injection |
| `test_p1_schedule_pipeline.py` | 3 tests | remove_window, delay_from, ETA with real schedule |
| `test_p1_vrp_boundaries.py` | 3 tests | No-skill, insufficient inventory, shift overrun |
| `test_p2_edge_cases.py` | 2 tests | Cycle rejection, FAILED re-report guard |

**Total: 15 test functions, 7 modules. All verified behaviors pass.**

## Known Gaps

| Gap | Impact | Status |
|---|---|---|
| VRP eligibility reason strings computed but discarded | Dispatcher receives empty result for all rejection reasons — can't tell skill-gap from 1-drum-short | Documented, not blocking |
| Frontend event log icon: `"system"` renders as `"manual"` | Auto-unlock events indistinguishable from operator actions in audit log | Documented, low priority |
| `sync_to_supabase` never verified against real Supabase instance | Batch upsert implemented but only tested with mock | Needs live Supabase test before production |

## Env Vars

| Variable | Module | Purpose |
|---|---|---|
| `DATABASE_URL` | Prisma | PostgreSQL connection |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | better-auth | OAuth |
| `BETTER_AUTH_URL` | better-auth | Auth callback |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Python backend | Supabase client |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase + Realtime |
| `LLM_API_KEY` | Parser Tier 3 | LLM API key (OpenAI-compatible) |
| `LLM_BASE_URL` | Parser Tier 3 | Custom LLM endpoint |
| `LLM_MODEL` | Parser Tier 3 | Model name (default: `gpt-4o-mini`) |
