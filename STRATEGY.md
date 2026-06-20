# Imagine Hack — Strategic Overview

## Project Narrative (for Judges)

**One-liner:**
> An AI-powered construction workforce manager that reads your Telegram chat, assigns workers automatically, and handles last-minute disruptions in real time.

**Elevator pitch (30 seconds):**
> "Every morning, construction foremen spend hours juggling WhatsApp and Telegram messages — 'Ah Ming MC today', 'Site B needs two more tilers'. They manually figure out who's available, who has the right skills, and who's closest to the site. We automate that. Our Telegram bot listens to your existing chat, parses natural language messages using AI, assigns workers based on skill and availability, and when someone calls in sick — it instantly suggests the best replacement. The dashboard shows you real-time worker status, utilization rates, and CO2 saved from smarter routing. It's smarter workforce management for the construction industry."

---

## Strategic Recommendations

### 1. Demo Flow — The "Before/After" Story

The most memorable demo structure follows a pain → solution → impact arc:

| Phase | What happens on screen | Judge takeaway |
|-------|----------------------|----------------|
| **Before** | Show a cluttered Telegram chat with fragmented messages ("Ah Ming MC", "Site 2 need 2 more", "Anyone free?") | "This is chaos" |
| **System listens** | Telegram bot logs into the group, messages appear on the dashboard live with NLP-parsed entities highlighted (person, status, skill, site) | "It understands messy chat" |
| **Disruption** | A new message: "Kumar MC today" | Trigger event |
| **Auto-reassign** | System highlights Kumar's assignment as at-risk, finds the best replacement based on skill + availability + proximity, shows the recommendation | "It thinks ahead" |
| **Approve** | Foreman types /approve or it auto-assigns, dashboard updates live | "It closes the loop" |
| **Impact** | Dashboard shows metrics: utilization rate, disruptions handled, CO2 saved, overtime reduced | "It actually moves the needle" |

**Tip for the demo:** Plant a real person to send Telegram messages live during the demo so the NLP parsing feels authentic. Don't pre-record everything.

---

### 2. Suggested Architecture

```
Telegram Chat
    |
    v
[Telegram Bot] -- listens for messages
    |
    v
[LLM Parser] -- extracts: who, what skill, which site, what status
    |
    v
[Database] -- stores workers, skills, assignments, sites, attendance
    |
    v
[Assignment Engine] -- simple matcher (MVP) / optimizer (future)
    |
    v
[Dashboard] -- Next.js app with real-time updates
```

**Key design principle:** Keep the Telegram bot and the web app loosely coupled via the database. The bot writes events to the DB; the dashboard reads them; the assignment engine is a service that can be swapped out.

---

### 3. Module Breakdown (4+ people)

| Module | What it does | Who (recommended size) |
|--------|-------------|----------------------|
| **Telegram Bot (Python)** | Connect to Telegram, listen for new messages, download voice notes, forward to NLP pipeline | 1 person |
| **NLP / LLM Pipeline** | Parse natural language messages using LLM API, extract structured entities (worker name, status, skill, site, time) | 1 person |
| **Assignment Engine** | Match available workers to open shifts/ sites based on skills + workload; suggest replacements on disruption | 1 person |
| **Dashboard (Next.js)** | Real-time worker status board, live message feed, approval flow, sustainability metrics | 1 person |
| **Integration & Data** | Database schema, seeding demo data, connecting all modules, demo scripting | Shared / 1 person |

With 5 people this maps nicely — one per module + one to glue it together.

---

### 4. Key Technical Decisions

| Decision | Recommendation | Why |
|----------|---------------|-----|
| **LLM** | Use an API (GPT-4o mini or Claude Haiku) for NLP parsing | Lowest cost, best accuracy for messy multilingual construction chat |
| **Message format** | LLM returns JSON: `{"worker": "Kumar", "status": "mc", "site": "Site B", "skill": "tiler", "confidence": 0.95}` | Structured output makes downstream logic trivial |
| **Database** | PostgreSQL (already set up via Supabase) | Already implemented with Prisma schema |
| **Realtime** | Server-Sent Events (SSE) or polling from dashboard | WebSockets add complexity; SSE is simpler for demo |
| **Telegram library** | Telethon (already implemented) | Already works, just needs to forward messages to the NLP endpoint |
| **Assignment algo** | Score-based: skill_match * 0.5 + availability * 0.3 + proximity * 0.2 | Simple to implement, easy to explain to judges |

---

### 5. Sustainability Metrics for Track 3

To satisfy the Track 3 requirements, tie every assignment decision to measurable impact:

| Metric | How it's calculated | Demo hook |
|--------|-------------------|-----------|
| **Utilization rate** | Hours worked / hours available per worker | Show the "before" (low utilization from manual assignment) vs "after" |
| **Disruption response time** | Time from Telegram message to reassignment | Show 30 seconds → under 1 second |
| **Travel distance saved** | Estimated km reduced by assigning nearest available worker | Show cumulative CO2 saved |
| **Overtime %** | Hours over 8 / total hours | Show reduction from balanced workload distribution |

---

### 6. Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| **LLM hallucinates worker names** | Validate extracted names against the database; if no match found, flag for manual review |
| **Real Telegram chat has no construction messages yet** | Seed a demo script that sends realistic messages on a timer during the demo |
| **NLP fails on Singlish/Manglish/Mandarin mix** | Include few-shot examples in the LLM prompt with the specific slang your target chat uses ("MC", "sakit", "tak boleh", "on the way") |
| **Dashboard feels empty without real data** | Build a seed script that populates 5-10 workers, 3 sites, and a history of assignments |
| **Time running out** | Cut the optimization engine entirely; focus on the Telegram -> NLP -> Dashboard -> Reassignment pipeline, which IS the core innovation |

---

## Immediate Next Steps

1. **Finalize team roles** — assign each person to one module from the breakdown above
2. **Set up the LLM API key** — get an API key for GPT-4o mini or Claude, test parsing 5 sample messages
3. **Extend the Telegram bot** — add an endpoint that forwards incoming messages to the NLP pipeline and stores structured results in the database
4. **Define the database schema** — tables for workers, sites, skills, assignments, attendance_events, messages
5. **Build the dashboard skeleton** — real-time message feed + worker status board
6. **Test the live reassignment flow** — send "Kumar MC" via Telegram, see it appear on the dashboard + get a replacement suggestion
7. **Polish the demo narrative** — rehearse the pain -> solution -> impact arc
