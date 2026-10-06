# Trading King Academy

A premium educational web application for **Trading King Academy.** Learners study forex, CFDs, market analysis, risk management, MetaTrader 5, and introducing-broker standards. Content is educational only and does not constitute investment advice.

This frontend is a complete React application. Login, courses, and progress use **Supabase Auth + Postgres** when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Without those keys, the same screens run on a localStorage mock so `npm run dev` still works.

Each live academy (Trading King, NextGen FX, Trade Rise, TradesX, FX Nova) should have **its own Supabase project**. See [docs/supabase.md](docs/supabase.md).

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- React Router
- Lucide React
- Supabase Auth + Postgres (optional; mock fallback)

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Leave the Supabase keys empty to use demo accounts in this browser. Fill them to talk to a real project.

Live site: [https://www.tradingkingacademy.com](https://www.tradingkingacademy.com)

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run oxlint |

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Student | `student@tradingkingacademy.com` | `Learn2026!` |
| Admin | `admin@tradingkingacademy.com` | `Admin2026!` |

The demo student is already enrolled in several courses, with one completed certificate. These accounts exist only in the localStorage mock. After Supabase is connected, register a student and promote an admin in SQL (see [docs/supabase.md](docs/supabase.md)).

## What is included

- Public marketing site: home, courses, categories, learning path, about, FAQ, terms, privacy
- Course details, enrolment, saved courses, lesson viewer, notes, resource download
- Quizzes with a 70% pass mark, answer review, and retake
- Student dashboard, my courses, certificates (print / PDF via the browser), profile
- Admin area: catalogue, modules, lessons, students, quizzes, certificates, reports
- Auth: login, self-registration, forgot / reset password (Supabase email, or a local demo token)
- AI Engine at `/engine`: three-column chart-study console (screen share, chart upload, video, voice). Education only — no buy/sell signals. Optionally connect a live OpenAI-compatible API with `AI_API_KEY`.

Progress, notes, enrolments, quiz attempts, certificates, and Engine plan/credits persist in Supabase when configured, otherwise under `baazex.academy.*` keys in localStorage. Engine chat threads stay in the browser.

## Connecting Supabase

1. Create a Supabase project (one per live academy).
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
3. Promote an admin: `update public.profiles set role = 'admin' where email = '...';`
4. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` on that Vercel project and redeploy.

Full steps, redirect URLs, and the five-academy table: [docs/supabase.md](docs/supabase.md).

## Design

Primary brand colours:

- Dark navy `#06152B`
- Baazex blue `#0066FF`
- Bright blue `#00A3FF`
- Canvas `#F4F8FC`
- Ink `#172033`

Logged-in workspaces use a collapsible navy sidebar inspired by a focused learning console, with a light content stage.

## Risk notice

Trading forex and CFDs involves significant risk and may not be suitable for all investors. Trading King Academy content is provided for educational purposes only and does not constitute investment advice, a recommendation, or a guarantee of trading results.
