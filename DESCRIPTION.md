# Imagine Hack

**Operational intelligence platform powered by real-time communication, AI transcription, and logistics optimization.**

Imagine Hack is a full-stack hackathon project that connects a Telegram-based operations feed to an intelligent optimization engine. It listens to a team chat in real time — transcribing voice messages, capturing photos, and logging text — and feeds that operational data into a suite of optimization solvers covering manpower allocation, scheduling, vehicle routing, and sustainability planning.

---

## Architecture

The project is composed of three main layers:

### 1. Telegram Bot (Python / Telethon + faster-whisper)
- Listens to a designated Telegram chat for messages, voice notes, and photos
- Transcribes voice messages into English text using OpenAI Whisper (faster-whisper, small model)
- Downloads photos and logs all activity to stdout
- Serves as the real-time operational data ingestion layer

### 2. Web Application (Next.js 16 + React 19 + TypeScript)
- User-facing dashboard with Google OAuth authentication (better-auth)
- PostgreSQL database via Prisma v7, hosted on Supabase
- Protected dashboard routes for operations management
- Built with Tailwind CSS v4 and React Compiler for optimized rendering

### 3. Optimization & Workflow Backend (Python, scaffolded)
- **VRP Solver** — Vehicle routing problem optimizer for fleet logistics
- **Scheduling Optimizer** — Shift and task scheduling
- **Manpower Optimizer** — Workforce allocation optimization
- **Sustainability Optimizer** — Environmental impact / carbon footprint optimization
- **Workflow Engine** — DAG-based workflow automation with state machines, event handlers, and regression capabilities
- **LLM Integration** — Prompt-based AI agent orchestration
- **Multi-channel Integrations** — Notifications, Supabase, Telegram, WhatsApp

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Auth | better-auth with Google OAuth |
| Database | PostgreSQL (Supabase), Prisma v7 ORM |
| Bot | Python 3.12, Telethon, faster-whisper |
| Optimization | Python (scaffolded solvers for VRP, scheduling, manpower, sustainability) |
| Workflow | Python DAG engine, state machines, event handlers |
| Integrations | Telegram, WhatsApp, Supabase, notifications |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- PostgreSQL database (Supabase instance configured)
- Telegram bot token and API credentials

### Web app

```bash
npm install
npx prisma generate
npm run dev
```

### Telegram bot

```bash
cd apps/backend
pip install -r requirements.txt
python entry.py
```

### Environment

Required variables in `.env`:

- `DATABASE_URL` — PostgreSQL connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `BETTER_AUTH_URL` — Auth callback base URL
- `API_ID` / `API_HASH` / `BOT_TOKEN` — Telegram API credentials
- `TARGET_CHAT` — Telegram chat ID to monitor

---

## Project Status

This project was built as a hackathon entry. The web app and Telegram bot are functional; the backend optimization modules and workflow engine are scaffolded and ready for implementation.
