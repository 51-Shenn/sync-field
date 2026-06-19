<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Quick start

```sh
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # ESLint v9 flat config (not `next lint`)
npm start        # serve production build
```

## Stack

- **Next.js 16** + **React 19** — read docs in `node_modules/next/dist/docs/` before coding
- **TypeScript** — `@/` maps to `./src/*`
- **Tailwind v4** — uses `@import "tailwindcss"` (not `@tailwind` directives)
- **React Compiler** enabled in `next.config.ts` (needs `babel-plugin-react-compiler`)

## Auth

- **better-auth** with Google OAuth + Prisma adapter + PostgreSQL
- Server: `src/lib/auth.ts` — client: `src/lib/auth-client.ts`
- API route: `src/app/api/auth/[...all]/route.ts`
- Middleware: root-level `proxy.ts` (not `src/middleware.ts`) — protects `/dashboard`

## Prisma v7

- Config: `prisma.config.ts` (new v7 format, not the old `prisma` CLI default)
- Client generated to `src/generated/prisma/client` (custom path, gitignored)
- Run `npx prisma generate` before first build; run `npx prisma migrate dev` for schema changes
- Requires `DATABASE_URL` env var (loaded via `dotenv` in `prisma.config.ts`)

## Environment

Required vars: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL`

**`.env` contains live credentials** (Telegram bot token, Google OAuth secrets) — never log or commit them.

## Caveats

- No test framework installed — skip any test commands
- No CI pipeline or `.github/` directory
- Python/Telegram bot artifacts present (`bot_session.session`, `__pycache__/`) but unrelated to the Next.js app
