-- Academy LMS schema (Auth + Postgres).
-- Run this entire file in the SQL editor of each academy's Supabase project.
--
-- After the first admin account exists (self-register or Dashboard > Auth):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- Auth → URL configuration must include this academy's Vercel URL (and later
-- the real domain) under Redirect URLs. Site URL should be the live origin.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Student',
  email text not null,
  mobile text not null default '',
  country text not null default '',
  country_code text not null default '',
  role text not null default 'student' check (role in ('student', 'admin', 'superadmin')),
  plan text not null default 'free' check (plan in ('free', 'basic')),
  questions_used integer not null default 0,
  avatar text,
  email_preferences jsonb not null default '{"productUpdates":true,"courseNotifications":true,"weeklyDigest":false}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  );
$$;

create table if not exists public.categories (
  id text primary key,
  slug text unique not null,
  name text not null,
  description text not null default '',
  icon text not null default '',
  difficulty text not null,
  estimated_hours integer not null default 0
);

create table if not exists public.courses (
  id text primary key,
  slug text unique not null,
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  category_id text not null references public.categories (id),
  difficulty text not null,
  duration_hours numeric not null default 1,
  objectives jsonb not null default '[]'::jsonb,
  instructor text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  popular boolean not null default false,
  featured boolean not null default false,
  quiz_id text not null default '',
  modules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quizzes (
  id text primary key,
  course_id text not null,
  title text not null,
  passing_score integer not null default 70,
  questions jsonb not null default '[]'::jsonb
);

create table if not exists public.enrollments (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id text not null references public.courses (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  saved boolean not null default false,
  primary key (user_id, course_id)
);

create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id text not null,
  lesson_id text not null,
  completed boolean not null default true,
  completed_at timestamptz,
  primary key (user_id, course_id, lesson_id)
);

create table if not exists public.lesson_notes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id text not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.quiz_attempts (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  quiz_id text not null,
  course_id text not null,
  answers jsonb not null default '{}'::jsonb,
  score integer not null,
  passed boolean not null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id text not null,
  student_name text not null,
  course_name text not null,
  completed_at timestamptz not null default now()
);

create table if not exists public.activity (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  detail text not null default '',
  type text not null,
  at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, full_name, email, mobile, country, country_code, role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Student'),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'mobile', ''),
    coalesce(new.raw_user_meta_data->>'country', ''),
    coalesce(new.raw_user_meta_data->>'country_code', ''),
    'student'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  -- Service role and the SQL editor have no auth.uid(). Students always do.
  if auth.uid() is null then
    return new;
  end if;
  if not public.is_admin() then
    new.role := old.role;
    new.plan := old.plan;
    if new.questions_used < old.questions_used then
      new.questions_used := old.questions_used;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

create or replace function public.touch_course_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at
  before update on public.courses
  for each row execute function public.touch_course_updated_at();

create or replace function public.ensure_catalog_seed(payload jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cat jsonb;
  course jsonb;
  quiz jsonb;
begin
  if exists (select 1 from public.courses limit 1) then
    return;
  end if;

  for cat in select value from jsonb_array_elements(coalesce(payload->'categories', '[]'::jsonb))
  loop
    insert into public.categories (id, slug, name, description, icon, difficulty, estimated_hours)
    values (
      cat->>'id',
      cat->>'slug',
      cat->>'name',
      coalesce(cat->>'description', ''),
      coalesce(cat->>'icon', ''),
      cat->>'difficulty',
      coalesce((cat->>'estimatedHours')::int, 0)
    )
    on conflict (id) do nothing;
  end loop;

  for course in select value from jsonb_array_elements(coalesce(payload->'courses', '[]'::jsonb))
  loop
    insert into public.courses (
      id, slug, title, subtitle, description, category_id, difficulty,
      duration_hours, objectives, instructor, status, popular, featured, quiz_id, modules
    )
    values (
      course->>'id',
      course->>'slug',
      course->>'title',
      coalesce(course->>'subtitle', ''),
      coalesce(course->>'description', ''),
      course->>'categoryId',
      course->>'difficulty',
      coalesce((course->>'durationHours')::numeric, 1),
      coalesce(course->'objectives', '[]'::jsonb),
      coalesce(course->>'instructor', ''),
      coalesce(course->>'status', 'published'),
      coalesce((course->>'popular')::boolean, false),
      coalesce((course->>'featured')::boolean, false),
      coalesce(course->>'quizId', ''),
      coalesce(course->'modules', '[]'::jsonb)
    )
    on conflict (id) do nothing;
  end loop;

  for quiz in select value from jsonb_array_elements(coalesce(payload->'quizzes', '[]'::jsonb))
  loop
    insert into public.quizzes (id, course_id, title, passing_score, questions)
    values (
      quiz->>'id',
      quiz->>'courseId',
      quiz->>'title',
      coalesce((quiz->>'passingScore')::int, 70),
      coalesce(quiz->'questions', '[]'::jsonb)
    )
    on conflict (id) do nothing;
  end loop;
end;
$$;

create or replace function public.consume_question()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  update public.profiles
    set questions_used = questions_used + 1
    where id = auth.uid()
    returning questions_used into used;
  return coalesce(used, 0);
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.courses enable row level security;
alter table public.quizzes enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_notes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.certificates enable row level security;
alter table public.activity enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories
  for select using (true);

drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists courses_select on public.courses;
create policy courses_select on public.courses
  for select using (status = 'published' or public.is_admin());

drop policy if exists courses_write on public.courses;
create policy courses_write on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists quizzes_select on public.quizzes;
create policy quizzes_select on public.quizzes
  for select using (true);

drop policy if exists quizzes_write on public.quizzes;
create policy quizzes_write on public.quizzes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists enrollments_write on public.enrollments;
create policy enrollments_write on public.enrollments
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists lesson_progress_select on public.lesson_progress;
create policy lesson_progress_select on public.lesson_progress
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists lesson_progress_write on public.lesson_progress;
create policy lesson_progress_write on public.lesson_progress
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists lesson_notes_select on public.lesson_notes;
create policy lesson_notes_select on public.lesson_notes
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists lesson_notes_write on public.lesson_notes;
create policy lesson_notes_write on public.lesson_notes
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists quiz_attempts_select on public.quiz_attempts;
create policy quiz_attempts_select on public.quiz_attempts
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists quiz_attempts_insert on public.quiz_attempts;
create policy quiz_attempts_insert on public.quiz_attempts
  for insert with check (auth.uid() = user_id or public.is_admin());

drop policy if exists certificates_select on public.certificates;
create policy certificates_select on public.certificates
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists certificates_insert on public.certificates;
create policy certificates_insert on public.certificates
  for insert with check (auth.uid() = user_id or public.is_admin());

drop policy if exists activity_select on public.activity;
create policy activity_select on public.activity
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists activity_insert on public.activity;
create policy activity_insert on public.activity
  for insert with check (auth.uid() = user_id or public.is_admin());

grant usage on schema public to anon, authenticated;

grant select on public.categories, public.courses, public.quizzes to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.enrollments, public.lesson_progress, public.lesson_notes to authenticated;
grant select, insert on public.quiz_attempts, public.certificates, public.activity to authenticated;
grant select, insert, update, delete on public.courses, public.categories, public.quizzes to authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.ensure_catalog_seed(jsonb) to anon, authenticated;
grant execute on function public.consume_question() to authenticated;

-- Existing databases keep the old role check until this runs.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.profiles'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.profiles
  add constraint profiles_role_check check (role in ('student', 'admin', 'superadmin'));

create table if not exists public.payment_settings (
  id integer primary key default 1 check (id = 1),
  price integer not null default 30,
  note text not null default '',
  upi_enabled boolean not null default false,
  upi_id text not null default '',
  upi_name text not null default '',
  bank_enabled boolean not null default false,
  bank_name text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  ifsc text not null default '',
  crypto_enabled boolean not null default false,
  crypto_asset text not null default '',
  crypto_network text not null default '',
  crypto_address text not null default ''
);

insert into public.payment_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  method text not null check (method in ('upi', 'bank', 'crypto')),
  reference text not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

alter table public.payment_settings enable row level security;
alter table public.payment_requests enable row level security;

drop policy if exists payment_settings_select on public.payment_settings;
create policy payment_settings_select on public.payment_settings
  for select using (true);

drop policy if exists payment_requests_select on public.payment_requests;
create policy payment_requests_select on public.payment_requests
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists payment_requests_insert on public.payment_requests;
create policy payment_requests_insert on public.payment_requests
  for insert with check (
    auth.uid() = user_id
    and status = 'pending'
  );

grant select on public.payment_settings to anon, authenticated;
grant select, insert on public.payment_requests to authenticated;
