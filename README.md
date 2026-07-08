# Cash Flow Minimizer

A single-page app that settles group debts using the minimum possible number
of transactions, built with Next.js (App Router), Prisma, and SQLite (swap
to Postgres for your submission/deployment — see `prisma/schema.prisma`).

## What's inside

- `lib/minimizeCashFlow.ts` — the core greedy settlement algorithm, pure and
  independently unit-tested (`tests/minimizeCashFlow.test.ts`).
- `app/api/participants`, `app/api/debts`, `app/api/settle`, `app/api/report`
  — REST-style API routes (Next.js's built-in equivalent to an Express server).
- `app/page.tsx` — the single-page wizard UI (Participants → Debts →
  Optimize → Report), calling the API routes above.
- `components/GraphView.tsx` — renders the before/after debt graphs as SVG.
- `prisma/schema.prisma` — 3 models: `Participant`, `Debt`, `Settlement`.

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run dev
```

Then open http://localhost:3000

## Running the tests

```bash
npm run test
```

This runs the algorithm's unit tests directly — no server or database needed.

## Switching to Postgres for submission

1. In `prisma/schema.prisma`, change the datasource block to:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in `.env` to your Postgres connection string.
3. Run `npx prisma migrate dev --name init` again.

## Notes

- There's no login/auth — everything lives under one shared `demo-group` ID,
  which keeps the scope appropriate for a 4-week academic project.
- Styling uses inline styles for reliability; Tailwind is already configured
  (`tailwind.config.ts`) if you'd rather restyle with utility classes.
- Deploy to Vercel as described in the original proposal — remember to point
  `DATABASE_URL` at a hosted Postgres instance (e.g. Vercel Postgres, Neon,
  Supabase) since Vercel's filesystem isn't persistent for SQLite.
