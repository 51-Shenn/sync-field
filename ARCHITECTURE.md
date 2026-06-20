# SyncField — System Architecture

```
 ┌──────────────────────────────────────────────────────────────────────┐
 │                         DATA SOURCES                                 │
 │  Telegram   WhatsApp    Mobile App    Dashboard     External API      │
 │  ┌──────┐   ┌───────┐  ┌────────┐  ┌──────────┐  ┌───────────┐     │
 │  │ Text │   │ Image │   │  OCR   │  │ Dispatcher│  │ 3rd Party │     │
 │  │Voice │   │  Doc  │   │ Button │  │ Override  │  │ Webhook   │     │
 │  └──┬───┘   └───┬───┘  └───┬────┘  └────┬─────┘  └─────┬─────┘     │
 └─────┼───────────┼──────────┼────────────┼──────────────┼────────────┘
       │           │          │            │              │
       ▼           ▼          ▼            ▼              ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │                      PREPROCESSING                                    │
 │  ┌──────────────────────────────────────────────────────────────┐    │
 │  │              FieldOpsParser (3-Tier)                          │    │
 │  │  Tier 1: JSON / Command ─── 60% traffic, $0                  │    │
 │  │  Tier 2: Manglish Keywords ─ 25% traffic, $0                 │    │
 │  │  Tier 3: LLM (north-mini-code) ─ 15% traffic, free           │    │
 │  │  Output: ParseResult(task_id, failure_type, tech_id, tier)   │    │
 │  └──────────────────────────┬───────────────────────────────────┘    │
 └──────────────────────────────┼────────────────────────────────────────┘
                                │
                                ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │                        DATABASE (Supabase)                            │
 │  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐   │
 │  │  tasks  │ │ sites  │ │projects  │ │ alerts │ │tech_events   │   │
 │  │  4 rows │ │ 0 rows │ │  0 rows  │ │ 0 rows │ │   0 rows     │   │
 │  └────┬────┘ └────────┘ └──────────┘ └───┬────┘ └──────┬───────┘   │
 │       │                                  │              │            │
 │  ┌────┴──────────┐  ┌───────────────┐   │              │            │
 │  │ technicians   │  │ msg_original  │   │              │            │
 │  │   2 rows      │  │   10 rows     │   │              │            │
 │  └───────────────┘  └───────────────┘   │              │            │
 │                                         │              │            │
 │  ┌──────────────────────────┐           │              │            │
 │  │   Supabase Realtime      │◄──────────┘──────────────┘            │
 │  │   (CDC WebSocket push)   │                                        │
 │  └──────────┬───────────────┘                                        │
 └──────────────┼────────────────────────────────────────────────────────┘
                │
      ┌─────────┴─────────┐
      ▼                   ▼
 ┌──────────────┐  ┌────────────────────────────────────────────────────┐
 │ Event Bus    │  │              PROCESS LAYER                          │
 │ (Realtime)   │  │                                                     │
 │              │  │  ① DomainRules ─── FailurePolicy lookup             │
 │ ◄─ CDC ──────┼──┤       │                                             │
 │              │  │       ▼                                             │
 │ idempotency  │  │  ② DAG Engine ─── evaluate_graph() cascade         │
 │ guard:       │  │       │   ┌──────────────────────────────┐         │
 │ memory==db?  │  │       │   │ Cycle Detection (DFS O(V+E)) │         │
 │ → skip       │  │       │   │ Dirty-set eval (O(Δ×depth)) │         │
 │              │  │       │   │ Circuit breaker (depth=20)   │         │
 │              │  │       │   └──────────────────────────────┘         │
 │              │  │       ▼                                             │
 │              │  │  ③ Schedule Engine ─── compute_cascade_eta()       │
 │              │  │       │   ┌──────────────────────────────┐         │
 │              │  │       │   │ EXACT → ESTIMATED → UNKNOWN  │         │
 │              │  │       │   │ TechnicianSchedule lookup    │         │
 │              │  │       │   │ remove_window / delay_from  │         │
 │              │  │       │   └──────────────────────────────┘         │
 │              │  │       ▼                                             │
 │              │  │  ④ VRP Solver ─── CP-SAT (2s timeout)              │
 │              │  │       │   ┌──────────────────────────────┐         │
 │              │  │       │   │ Hard: skills, inv, shift      │         │
 │              │  │       │   │ Soft: priority − distance     │         │
 │              │  │       │   │ Joint assignment (not greedy) │         │
 │              │  │       │   └──────────────────────────────┘         │
 │              │  │       ▼                                             │
 │              │  │  ⑤ Dispatcher ─── notify + sync_to_supabase()      │
 │              │  │       │                                             │
 │              │  │       ├──► StubNotifier (→ Telegram/WhatsApp)      │
 │              │  │       └──► batch upsert tasks + insert events       │
 │              │  │                  (2 Supabase calls, any depth)      │
 └──────────────┘  └────────────────────┬────────────────────────────────┘
                                        │
                                        ▼
 ┌──────────────────────────────────────────────────────────────────────┐
 │                        APPLICATION LAYER                              │
 │                                                                       │
 │  ┌─────────────────────────┐    ┌──────────────────────────────┐     │
 │  │  Dispatcher Dashboard   │    │   Telegram Bot                │     │
 │  │  (Next.js + Realtime)   │    │   (Telethon + faster-whisper) │     │
 │  │                         │    │                                │     │
 │  │  • Live DAG visualization│    │  • Group chat monitoring       │     │
 │  │  • 7-state color coding │    │  • Voice → text transcription │     │
 │  │  • Cascade animation    │    │  • Document OCR (Gemini)      │     │
 │  │  • Real-time event log  │    │  • Failure report routing     │     │
 │  └─────────────────────────┘    └──────────────────────────────┘     │
 └──────────────────────────────────────────────────────────────────────┘
```

---

## Core Loop: Material Missing → Cascade → Reroute

```
 ┌──────────────┐
 │ Ahmad: "kabel│  ① Parser Tier 2
 │ habis, tak   │─────► "habis" → MATERIAL_MISSING
 │ cukup"       │     active_task_id → T03
 └──────────────┘
                      │
                      ▼
               ┌──────────────┐
               │ DomainRules  │  ② FailurePolicy[RESOURCE]
               │              │─────► escalate to procurement_lead
               │              │     max_local_retries = 0
               └──────┬───────┘
                      │
                      ▼
               ┌──────────────────────────────────────┐
               │ DAG Engine: evaluate_graph()          │  ③ Cascade
               │                                      │
               │  T03 → BLOCKED                       │
               │  T04 → LOCKED (depends on T03)       │
               │  T05 → LOCKED (depends on T03)       │
               │  T06..T08 → already LOCKED, no change│
               │                                      │
               │  4 affected techs found via BFS       │
               └──────────────┬───────────────────────┘
                              │
                              ▼
               ┌──────────────────────────────────────┐
               │ Schedule Engine: compute_cascade_eta │  ④ ETA
               │                                      │
               │  T03: UNKNOWN (no resolution_eta)    │
               │  T04: UNKNOWN (upstream unknown)     │
               │  T05..T08: UNKNOWN                    │
               │                                      │
               │  → "Cannot estimate — awaiting        │
               │     procurement update"               │
               └──────────────┬───────────────────────┘
                              │
                              ▼
               ┌──────────────────────────────────────┐
               │ VRP Solver: solve_reassignment()     │  ⑤ Reroute
               │                                      │
               │  4 displaced techs × READY tasks      │
               │  CP-SAT solves in <2s                 │
               │                                      │
               │  Ahmad → S01 (Site B, pull cable)    │
               │  Ravi  → S02 (Site B, mount camera)  │
               │  Zul   → S03 (Site B, config NVR)    │
               │  Haziq → standby (no eligible task)  │
               └──────────────┬───────────────────────┘
                              │
                              ▼
               ┌──────────────────────────────────────┐
               │ Dispatcher                            │  ⑥ Notify
               │                                      │
               │  🔔 Alert: procurement_lead           │
               │  📩 Ahmad: rerouted to S01           │
               │  📩 Ravi:  rerouted to S02           │
               │  📩 Zul:   rerouted to S03           │
               │  📩 Haziq: standby                   │
               │                                      │
               │  sync_to_supabase():                  │
               │    1 upsert(tasks) + 1 insert(events) │
               └──────────────────────────────────────┘
```

---

## State Machine

```
                    ┌─────────┐
          ┌────────►│ LOCKED  │◄──────────┐
          │         └────┬────┘            │
          │              │ deps met        │ deps broken
          │              ▼                  │
          │         ┌─────────┐            │
          │         │  READY  │────────────┘
          │         └────┬────┘
          │              │ dispatch
          │              ▼
          │         ┌─────────┐     ┌──────────┐
  resume  │         │ ACTIVE  │────►│ BLOCKED  │ (material/site/tech)
          │         └────┬────┘     └────┬─────┘
          │              │               │
          │              │ complete      │ resolve
          │              ▼               ▼
          │         ┌──────────┐    back to ACTIVE
          │         │ COMPLETE │
          │         └────┬─────┘
          │              │ upstream fails
          │              ▼
          └────────┌───────────┐
                   │ REGRESSED │ (must redo)
                   └─────┬─────┘
                         │
                ┌──────────┐
                │  FAILED  │ (terminal)
                └──────────┘
```

---

## Confidence Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Resolution ETA set?         Resolution ETA unknown?             │
│         │                          │                             │
│         ▼                          ▼                             │
│  ┌─────────────┐            ┌─────────────────┐                 │
│  │   EXACT     │            │    UNKNOWN      │                 │
│  │ "21 Jun     │            │ "Cannot estimate│                 │
│  │  13:00"     │            │  — awaiting     │                 │
│  │             │            │  procurement"   │                 │
│  └──────┬──────┘            └────────┬────────┘                 │
│         │                            │                           │
│         ▼                            ▼                           │
│  ┌─────────────────────────────────────────────┐                │
│  │         Confidence degrades downstream       │                │
│  │  Any UNKNOWN upstream → child is UNKNOWN     │                │
│  │  Any ESTIMATED upstream → child is ESTIMATED │                │
│  │  All EXACT → child is EXACT                  │                │
│  └─────────────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Test Coverage

```
┌──────────────────────────────────────────────────────────────────┐
│                    18 TEST FUNCTIONS                              │
│                                                                   │
│  test_dag_scenarios.py (5)                                        │
│  ├── Scenario 1: Cascade + Joint VRP Reassignment                 │
│  ├── Scenario 2: Technical Failure → Retry → Escalate             │
│  ├── Scenario 3: Technician Absence → Free → Reassign             │
│  ├── Scenario 4: Parser 3-Tier + 8 Manglish signals               │
│  └── Scenario 5: ETA Propagation (UNKNOWN → EXACT)                │
│                                                                   │
│  test_parser_realworld.py (14 messages)                           │
│  ├── Tier 1: JSON + Command                                       │
│  ├── Tier 2: 7 Manglish keywords + active_task_id fallback        │
│  ├── Tier 3: ambiguous → LLM stub                                 │
│  └── Noise: emoji, lunch break, off-topic                         │
│                                                                   │
│  test_simulation_realworld.py (4 phases)                          │
│  ├── Setup: incomplete Site C data → no crash                     │
│  ├── Cascade: T03 material missing → 4 techs displaced             │
│  ├── Absence: Zul absent → tasks freed + re-solve                 │
│  └── ETA bug: all-COMPLETE deps → EXACT (fixed)                   │
│                                                                   │
│  P0: test_p0_regression_cascade.py                                │
│  ├── Full chain: COMPLETE→REGRESSED, multi-layer                  │
│  └── Partial parent: only C regresses, D stays COMPLETE            │
│                                                                   │
│  P0: test_p0_custom_policy.py                                     │
│  ├── Custom retry count: TECHNICAL retries 3x                     │
│  └── Custom escalation role: "senior_network_lead"                │
│                                                                   │
│  P1: test_p1_schedule_pipeline.py                                 │
│  ├── remove_window: lunch break excluded from slot search         │
│  ├── delay_from: afternoon window shifted by 90min                │
│  └── compute_cascade_eta with real TechnicianSchedule             │
│                                                                   │
│  P1: test_p1_vrp_boundaries.py                                    │
│  ├── No skill match → empty, no crash                             │
│  ├── Inventory shortage → reason string verified                  │
│  └── Shift overrun + exact-fit boundary                           │
│                                                                   │
│  P2: test_p2_edge_cases.py                                        │
│  ├── 2-node cycle → rejected at construction (ValueError)         │
│  └── FAILED re-report → ALREADY_FAILED guard                      │
│                                                                   │
│  test_template_guesser.py (3)                                     │
│  ├── Cold start: empty DB → all guessed=True                      │
│  ├── Confidence: P(Survey|Conduit) = 1.0                          │
│  └── Instantiate: name→prefixed ID remap                          │
│                                                                   │
│  test_event_bus.py (4)                                            │
│  ├── Idempotency: memory==db → skip                               │
│  ├── External change: triggers engine                             │
│  ├── Missing task: silently ignored                               │
│  └── Null payload: 5 variants, all skipped                        │
└──────────────────────────────────────────────────────────────────┘
```
