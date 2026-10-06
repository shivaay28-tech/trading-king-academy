# Supabase for each academy

The app uses **one codebase**. Each live academy gets **its own Supabase project** (Auth + Postgres). If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing, the existing localStorage mock still runs.

## 1. Create a project

In [Supabase](https://supabase.com/dashboard) create a project per academy:

| Academy | Suggested project name |
| --- | --- |
| Trading King Academy | `trading-king-academy` |
| NextGen FX Academy | `nextgen-fx-academy` |
| Trade Rise Academy | `trade-rise-academy` |
| TradesX Academy | `tradesx-academy` |
| FX Nova Academy | `fx-nova-academy` |

The source Baazex site can use a sixth project, or stay on the mock until you add one.

## 2. Run the schema

SQL editor → paste and run [`supabase/schema.sql`](../supabase/schema.sql).

That creates profiles, categories, courses (modules/lessons as JSONB), quizzes, enrolments, progress, notes, attempts, certificates, activity, RLS, the signup trigger, and a one-time catalogue seed function.

The first page load calls `ensure_catalog_seed` with the current branded course catalogue.

## 3. Promote an admin

Self-register once (or create the user in Authentication), then:

```sql
update public.profiles
set role = 'admin'
where email = 'you@your-academy-domain.com';
```

Passwords never go in `profiles`.

## 4. Auth URLs

Authentication → URL configuration:

- **Site URL**: that academy’s live origin (Vercel URL now, custom domain later)
- **Redirect URLs**: the same origin, plus `/login` and `/reset-password` on that origin

Example for Trading King:

```
https://trading-king-academy.vercel.app
https://trading-king-academy.vercel.app/login
https://trading-king-academy.vercel.app/reset-password
https://www.tradingkingacademy.com
https://www.tradingkingacademy.com/login
https://www.tradingkingacademy.com/reset-password
```

Turn **Confirm email** off if students should land in the app immediately after Create account. Leave it on if you want a confirmation mail first.

## 5. Keys on Vercel

Project Settings → Environment Variables, for **Production** (and Preview if you want):

| Name | Where it is used | Secret? |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser + `/api/admin/users` | Project URL is public |
| `VITE_SUPABASE_ANON_KEY` | Browser + `/api/admin/users` | Anon key is public, RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/admin/users` only | **Yes — never `VITE_`** |

Then redeploy that academy.

Locally, copy `.env.example` to `.env.local` and fill the same three values. `npm run dev` keeps the mock if they are blank.

## 6. What is stored where

- **Supabase Auth**: email/password
- **`profiles`**: name, country, role, plan, question credits
- **Postgres**: published catalogue, enrolments, lesson complete, notes, quizzes, certificates
- **This browser**: AI Engine chat threads (not in the database on this pass)

Admin **Create student** (Manage students) posts to `/api/admin/users`, which checks the admin JWT then uses the service-role key so the browser never holds it.
