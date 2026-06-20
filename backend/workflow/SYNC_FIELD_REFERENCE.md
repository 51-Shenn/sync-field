# SyncField DAG Architecture Reference

## Architecture

```
Parser (3-tier) → DAG Engine → Domain Rules → CP-SAT VRP Solver → Dispatcher
         ↑                                              ↓
    Resolution Cache                            Supabase Realtime
```

## Module Map

| Module | File | Status |
|---|---|---|
| DAG Engine | `dag_engine/dag_engine.py` | ✅ Production |
| Domain Rules | `dag_engine/dag_engine.py` (FieldOpsDomainRules) | ✅ Production |
| VRP Solver | `optimization/vrp_solver/solver.py` | ✅ Production |
| Dispatcher | `event_handlers/dispatcher.py` | ✅ Production |
| Parser | `parser/parser.py` | ✅ Tier 1+2 prod, Tier 3 stub |
| Resolution Cache | `db/resolution_cache.py` | ✅ Production |
| Supabase Client | `integrations/supabase/client.py` | ✅ Production |

## Bug Catalog

### BUG-1: Aggressive auto-lock protects ACTIVE/BLOCKED/REGRESSED from cascade eviction

**Fixed**: `evaluate_graph()` only re-locks `READY` tasks. Running tasks (ACTIVE, BLOCKED, REGRESSED) are protected from dependency regression re-lock.

### BUG-2: Conditional `assigned_to` clearing

**Fixed**: Only clear `assigned_to` if the technician was successfully reassigned. Standby techs keep their original assignment (paused, not deleted).

### BUG-3: Per-assignment score not solver.ObjectiveValue()

**Fixed**: `Assignment.score` is calculated per assignment as `priority - distance_penalty`, not from the solver's combined model objective value.

### BUG-4: Depth threading through recursion

**Fixed**: `evaluate_graph(depth)` passes depth parameter through recursive calls. Events include `depth` field. `MAX_CASCADE_DEPTH=20` circuit breaker prevents infinite recursion.

## Optimization Catalog

### OPT-1: Circuit breaker

Depth guard in `evaluate_graph()`. Returns empty list at `MAX_CASCADE_DEPTH=20`.

### OPT-2: CP-SAT solver with 2s timeout

OR-Tools CP-SAT constraint solver with hard constraints (skills, inventory, shift) and soft objectives (priority - distance). 2-second solve timeout.

### OPT-3: Joint reassignment (not sequential)

Solver assigns all displaced technicians simultaneously, avoiding the greed-ordering problem.

### OPT-4: BFS descendant traversal

`get_descendants()` uses BFS from `children_map` for O(V+E) downstream detection.

### OPT-5: Data completeness tracking

`TaskPriority` includes `granularity` (DETAILED/ESTIMATE) and `data_sources_used` list for scoring transparency.

### OPT-6: Exclusion set (not in-place removal)

`solve_reassignment()` takes `exclude_tasks: Set[str]` to block tasks without mutating the DAG.

### OPT-13: SHA-256 resolution cache

`ResolutionCache` uses SHA-256 hash on normalized `message|context` for exact-match LLM cache, avoiding vector DB dependency.

## Parser Tier Architecture

| Tier | Method | Resolves | Falls Through |
|---|---|---|---|
| 1 | Structured (JSON + Command) | `{"task_id": "T03", ...}` / `report T03 MATERIAL_MISSING by Ahmad` | Non-matching → Tier 2 |
| 2 | Keyword/Regex | Natural language with failure keywords + task ID | No keyword match → Tier 3 |
| 3 | LLM (OpenAI-compatible) | Ambiguous free-text | Returns empty `ParseResult` on failure |

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

## Env Vars

| Variable | Module | Purpose |
|---|---|---|
| `DATABASE_URL` | Prisma | PostgreSQL connection |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | better-auth | OAuth |
| `BETTER_AUTH_URL` | better-auth | Auth callback |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | Python backend | Supabase client |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Supabase client |
| `LLM_API_KEY` | Parser Tier 3 | LLM API key (OpenAI-compatible) |
| `LLM_BASE_URL` | Parser Tier 3 | Custom LLM endpoint (optional) |
| `LLM_MODEL` | Parser Tier 3 | Model name (default: `gpt-4o-mini`) |
