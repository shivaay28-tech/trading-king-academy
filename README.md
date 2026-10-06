# Trading King Academy

A premium educational web application for **Trading King Academy.** Learners study forex, CFDs, market analysis, risk management, MetaTrader 5, and introducing-broker standards. Content is educational only and does not constitute investment advice.

This frontend is a complete React application with mock authentication and progress services on `localStorage`, structured so a REST API or CRM can be connected later.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- React Router
- Lucide React

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

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

The demo student is already enrolled in several courses, with one completed certificate.

## What is included

- Public marketing site: home, courses, categories, learning path, about, FAQ, terms, privacy
- Course details, enrolment, saved courses, lesson viewer, notes, resource download
- Quizzes with a 70% pass mark, answer review, and retake
- Student dashboard, my courses, certificates (print / PDF via the browser), profile
- Admin area: catalogue, modules, lessons, students, quizzes, certificates, reports
- Mock auth: login, registration, forgot / reset password
- AI Engine at `/engine`: three-column chart-study console (screen share, chart upload, video, voice). Education only — no buy/sell signals. Optionally connect a live OpenAI-compatible API with `VITE_AI_BASE_URL` and `VITE_AI_API_KEY`.

Progress, notes, enrolments, quiz attempts, and certificates persist in `localStorage` under the `baazex.academy.*` keys.

## Connecting a backend later

1. Copy `.env.example` and set `VITE_API_BASE_URL`.
2. Replace the localStorage calls in `src/services/auth.ts`, `src/services/catalog.ts`, and `src/services/progress.ts` with `apiRequest` from `src/services/api.ts`.
3. Keep the existing TypeScript types in `src/types` as the contract for CRM and LMS endpoints.

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
