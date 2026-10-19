create extension if not exists pgcrypto;

do $$ begin
  create type public.profile_role as enum ('student', 'trainer', 'admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.question_type as enum ('mcq', 'coding', 'short_answer');
exception when duplicate_object then null; end $$;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  city text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.profile_role,
  full_name text not null default '',
  email text,
  institution_id uuid references public.institutions(id) on delete set null,
  department text,
  year_of_study smallint check (year_of_study between 1 and 8),
  roll_number text,
  target_role text,
  designation text,
  subjects_taught text[],
  resume_score smallint check (resume_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, roll_number)
);

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  code text not null unique,
  department text,
  start_date date,
  end_date date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.batch_members (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (batch_id, student_id)
);

create table if not exists public.batch_trainers (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  unique (batch_id, trainer_id)
);

create table if not exists public.trainer_feedback (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  feedback text not null check (char_length(feedback) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  topic text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  type public.question_type not null default 'mcq',
  prompt text not null,
  options jsonb,
  answer text,
  explanation text,
  created_at timestamptz not null default now()
);
create unique index if not exists questions_institution_prompt_unique on public.questions (institution_id, prompt);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.test_questions (
  test_id uuid not null references public.tests(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position integer not null default 0,
  points numeric(6,2) not null default 1,
  primary key (test_id, question_id)
);

create table if not exists public.test_assignments (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  batch_id uuid not null references public.batches(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  starts_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  unique (test_id, batch_id)
);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric(7,2),
  max_score numeric(7,2),
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'reviewed')),
  unique (test_id, student_id, started_at)
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer text,
  is_correct boolean,
  time_spent integer not null default 0 check (time_spent >= 0),
  unique (attempt_id, question_id)
);

create table if not exists public.coding_problems (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  title text not null,
  slug text not null unique,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  statement text not null,
  tags text[] not null default '{}',
  company_tags text[] not null default '{}',
  starter_code jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.test_cases (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.coding_problems(id) on delete cascade,
  input text not null,
  expected_output text not null,
  is_hidden boolean not null default false
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  problem_id uuid not null references public.coding_problems(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  language text not null,
  source_code text not null,
  status text not null default 'pending',
  passed_count integer not null default 0,
  total_count integer not null default 0,
  runtime_ms integer,
  memory_kb integer,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  title text not null,
  category text not null,
  description text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  content text,
  video_url text,
  duration_minutes integer not null default 0,
  position integer not null default 0
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz,
  unique (lesson_id, student_id)
);

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(id) on delete cascade,
  ats_score smallint check (ats_score between 0 and 100),
  analysis jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  round_type text not null,
  difficulty text not null default 'medium',
  created_at timestamptz not null default now()
);

create table if not exists public.interview_messages (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  role text not null check (role in ('assistant', 'user')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.interview_reports (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null unique references public.interviews(id) on delete cascade,
  overall_score numeric(5,2),
  report jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text
);

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (student_id, badge_id)
);

create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  points integer not null,
  reason text not null,
  source_key text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.profiles(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  name text not null,
  category text,
  logo_url text,
  unique (institution_id, name)
);

create table if not exists public.company_roadmaps (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  content jsonb not null default '{}',
  position integer not null default 0
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  body text not null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.prevent_profile_role_change()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'A profile role cannot be changed after it is assigned';
  end if;
  if new.institution_id is distinct from old.institution_id then
    raise exception 'An account institution cannot be changed after onboarding';
  end if;
  if new.resume_score is distinct from old.resume_score then
    raise exception 'Resume scores can only be set by a trusted analysis service';
  end if;
  return new;
end;
$$;
drop trigger if exists profile_role_is_immutable on public.profiles;
create trigger profile_role_is_immutable before update on public.profiles
for each row execute function public.prevent_profile_role_change();

create or replace function public.current_role()
returns public.profile_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.current_institution_id()
returns uuid language sql stable security definer set search_path = public
as $$ select institution_id from public.profiles where id = auth.uid() $$;
create or replace function public.is_batch_member(target_batch uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.batch_members where batch_id = target_batch and student_id = auth.uid()) $$;
create or replace function public.is_batch_trainer(target_batch uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.batch_trainers where batch_id = target_batch and trainer_id = auth.uid()) $$;

alter table public.institutions enable row level security;
alter table public.profiles enable row level security;
alter table public.batches enable row level security;
alter table public.batch_members enable row level security;
alter table public.batch_trainers enable row level security;
alter table public.trainer_feedback enable row level security;
alter table public.questions enable row level security;
alter table public.tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_assignments enable row level security;
alter table public.test_attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.coding_problems enable row level security;
alter table public.test_cases enable row level security;
alter table public.submissions enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.resumes enable row level security;
alter table public.resume_analyses enable row level security;
alter table public.interviews enable row level security;
alter table public.interview_messages enable row level security;
alter table public.interview_reports enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.points_ledger enable row level security;
alter table public.streaks enable row level security;
alter table public.companies enable row level security;
alter table public.company_roadmaps enable row level security;
alter table public.announcements enable row level security;

create policy "Authenticated users can read institutions" on public.institutions for select to authenticated using (true);
create policy "Users can read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Admins can read institution profiles" on public.profiles for select to authenticated
  using (institution_id = public.current_institution_id() and public.current_role() = 'admin');
create policy "Trainers can read assigned batch profiles" on public.profiles for select to authenticated
  using (public.current_role() = 'trainer' and exists (
    select 1 from public.batch_members bm join public.batch_trainers bt on bt.batch_id = bm.batch_id
    where bm.student_id = profiles.id and bt.trainer_id = auth.uid()));
create policy "Users can update own non-role profile fields" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Institution staff read batches" on public.batches for select to authenticated
  using (institution_id = public.current_institution_id() and public.current_role() = 'admin');
create policy "Trainers read assigned batches" on public.batches for select to authenticated using (public.is_batch_trainer(id));
create policy "Batch members can read their batches" on public.batches for select to authenticated
  using (public.is_batch_member(id));
create policy "Admins manage institution batches" on public.batches for all to authenticated
  using (institution_id = public.current_institution_id() and public.current_role() = 'admin')
  with check (institution_id = public.current_institution_id() and public.current_role() = 'admin');
create policy "Members read batch membership" on public.batch_members for select to authenticated
  using (student_id = auth.uid() or public.is_batch_trainer(batch_id) or public.current_role() = 'admin' and exists (
    select 1 from public.batches b where b.id = batch_id and b.institution_id = public.current_institution_id()));
create policy "Admins manage batch membership" on public.batch_members for all to authenticated
  using (public.current_role() = 'admin' and exists (select 1 from public.batches b where b.id = batch_id and b.institution_id = public.current_institution_id()))
  with check (public.current_role() = 'admin' and exists (select 1 from public.batches b join public.profiles p on p.id = student_id
    where b.id = batch_id and b.institution_id = public.current_institution_id() and p.institution_id = b.institution_id and p.role = 'student'));
create policy "Staff read batch trainers" on public.batch_trainers for select to authenticated
  using (trainer_id = auth.uid() or public.current_role() = 'admin' and exists (select 1 from public.batches b where b.id = batch_id and b.institution_id = public.current_institution_id()));
create policy "Admins manage batch trainers" on public.batch_trainers for all to authenticated
  using (public.current_role() = 'admin' and exists (select 1 from public.batches b where b.id = batch_id and b.institution_id = public.current_institution_id()))
  with check (public.current_role() = 'admin' and exists (select 1 from public.batches b join public.profiles p on p.id = trainer_id
    where b.id = batch_id and b.institution_id = public.current_institution_id() and p.institution_id = b.institution_id and p.role = 'trainer'));
create policy "Students and assigned trainers read feedback" on public.trainer_feedback for select to authenticated
  using (student_id = auth.uid() or trainer_id = auth.uid() or public.current_role() = 'admin' and exists (
    select 1 from public.batches b where b.id = batch_id and b.institution_id = public.current_institution_id()));
create policy "Assigned trainers write feedback" on public.trainer_feedback for insert to authenticated
  with check (trainer_id = auth.uid() and public.current_role() = 'trainer' and public.is_batch_trainer(batch_id)
    and exists (select 1 from public.batch_members bm where bm.batch_id = batch_id and bm.student_id = trainer_feedback.student_id));
create policy "Feedback authors update own feedback" on public.trainer_feedback for update to authenticated
  using (trainer_id = auth.uid() and public.is_batch_trainer(batch_id))
  with check (trainer_id = auth.uid() and public.is_batch_trainer(batch_id));

create policy "Institution users read questions" on public.questions for select to authenticated
  using (institution_id is null or institution_id = public.current_institution_id());
create policy "Staff manage questions" on public.questions for all to authenticated
  using (public.current_role() in ('trainer', 'admin') and (institution_id is null or institution_id = public.current_institution_id()))
  with check (public.current_role() in ('trainer', 'admin') and (institution_id is null or institution_id = public.current_institution_id()));
create policy "Users read published tests" on public.tests for select to authenticated
  using ((published and institution_id = public.current_institution_id()) or created_by = auth.uid() or public.current_role() = 'admin' and institution_id = public.current_institution_id());
create policy "Staff create tests" on public.tests for insert to authenticated
  with check (created_by = auth.uid() and public.current_role() in ('trainer', 'admin') and institution_id = public.current_institution_id());
create policy "Owners and admins update tests" on public.tests for update to authenticated
  using (created_by = auth.uid() or public.current_role() = 'admin' and institution_id = public.current_institution_id())
  with check (created_by = auth.uid() or public.current_role() = 'admin' and institution_id = public.current_institution_id());
create policy "Test viewers read test questions" on public.test_questions for select to authenticated
  using (exists (select 1 from public.tests t where t.id = test_id and (
    (t.published and t.institution_id = public.current_institution_id())
    or t.created_by = auth.uid()
    or public.current_role() = 'admin' and t.institution_id = public.current_institution_id())));
create policy "Test owners manage test questions" on public.test_questions for all to authenticated
  using (exists (select 1 from public.tests t where t.id = test_id and (t.created_by = auth.uid() or public.current_role() = 'admin' and t.institution_id = public.current_institution_id())))
  with check (exists (select 1 from public.tests t where t.id = test_id and (t.created_by = auth.uid() or public.current_role() = 'admin' and t.institution_id = public.current_institution_id())));
create policy "Students and staff read relevant assignments" on public.test_assignments for select to authenticated
  using (public.is_batch_member(batch_id) or public.is_batch_trainer(batch_id) or public.current_role() = 'admin' and exists (
    select 1 from public.batches b where b.id = batch_id and b.institution_id = public.current_institution_id()));
create policy "Staff manage assignments" on public.test_assignments for all to authenticated
  using ((public.is_batch_trainer(batch_id) or public.current_role() = 'admin') and exists (select 1 from public.batches b where b.id = batch_id and b.institution_id = public.current_institution_id()))
  with check ((public.is_batch_trainer(batch_id) or public.current_role() = 'admin') and exists (select 1 from public.batches b where b.id = batch_id and b.institution_id = public.current_institution_id()));

create policy "Students and staff read attempts" on public.test_attempts for select to authenticated
  using (student_id = auth.uid() or public.current_role() in ('trainer', 'admin') and exists (
    select 1 from public.test_assignments a join public.batches b on b.id = a.batch_id
    where a.test_id = test_id and b.institution_id = public.current_institution_id()
      and (public.current_role() = 'admin' or public.is_batch_trainer(b.id))));
create policy "Attempt participants read answers" on public.attempt_answers for select to authenticated
  using (exists (select 1 from public.test_attempts a where a.id = attempt_id and (
    a.student_id = auth.uid() or public.current_role() = 'admin' and exists (
      select 1 from public.test_assignments ta join public.batches b on b.id = ta.batch_id where ta.test_id = a.test_id and b.institution_id = public.current_institution_id())
    or public.current_role() = 'trainer' and exists (
      select 1 from public.test_assignments ta where ta.test_id = a.test_id and public.is_batch_trainer(ta.batch_id))
  )));

create policy "Authenticated users read coding problems" on public.coding_problems for select to authenticated
  using (institution_id is null or institution_id = public.current_institution_id());
create policy "Staff manage coding problems" on public.coding_problems for all to authenticated
  using (public.current_role() in ('trainer', 'admin')) with check (public.current_role() in ('trainer', 'admin'));
create policy "Problem viewers read visible test cases" on public.test_cases for select to authenticated
  using (not is_hidden and exists (select 1 from public.coding_problems p where p.id = problem_id
    and (p.institution_id is null or p.institution_id = public.current_institution_id())));
create policy "Staff manage test cases" on public.test_cases for all to authenticated
  using (public.current_role() in ('trainer', 'admin') and exists (select 1 from public.coding_problems p where p.id = problem_id
    and (p.institution_id is null or p.institution_id = public.current_institution_id())))
  with check (public.current_role() in ('trainer', 'admin') and exists (select 1 from public.coding_problems p where p.id = problem_id
    and (p.institution_id is null or p.institution_id = public.current_institution_id())));
create policy "Students read own submissions" on public.submissions for select to authenticated using (student_id = auth.uid());
create policy "Admins read institution submissions" on public.submissions for select to authenticated using (
  public.current_role() = 'admin' and exists (select 1 from public.profiles p where p.id = student_id and p.institution_id = public.current_institution_id()));
create policy "Trainers read assigned student submissions" on public.submissions for select to authenticated using (
  public.current_role() = 'trainer' and exists (select 1 from public.batch_members bm join public.batch_trainers bt on bt.batch_id = bm.batch_id
    where bm.student_id = submissions.student_id and bt.trainer_id = auth.uid()));
create policy "Students create pending submissions" on public.submissions for insert to authenticated
  with check (student_id = auth.uid() and public.current_role() = 'student' and status = 'pending'
    and passed_count = 0 and total_count = 0 and runtime_ms is null and memory_kb is null);

create policy "Users read published courses" on public.courses for select to authenticated using (published or institution_id = public.current_institution_id());
create policy "Staff manage courses" on public.courses for all to authenticated
  using (public.current_role() in ('trainer', 'admin') and institution_id = public.current_institution_id())
  with check (public.current_role() in ('trainer', 'admin') and institution_id = public.current_institution_id());
create policy "Users read modules" on public.modules for select to authenticated using (exists (select 1 from public.courses c where c.id = course_id and (c.published or c.institution_id = public.current_institution_id())));
create policy "Users read lessons" on public.lessons for select to authenticated using (exists (select 1 from public.modules m join public.courses c on c.id = m.course_id where m.id = module_id and (c.published or c.institution_id = public.current_institution_id())));
create policy "Students manage own lesson progress" on public.lesson_progress for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "Staff read institution lesson progress" on public.lesson_progress for select to authenticated
  using ((public.current_role() = 'admin' and exists (select 1 from public.profiles p where p.id = student_id and p.institution_id = public.current_institution_id()))
    or (public.current_role() = 'trainer' and exists (select 1 from public.batch_members bm join public.batch_trainers bt on bt.batch_id = bm.batch_id
      where bm.student_id = lesson_progress.student_id and bt.trainer_id = auth.uid())));
create policy "Students manage own resumes" on public.resumes for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "Admins read institution resumes" on public.resumes for select to authenticated
  using (public.current_role() = 'admin' and exists (select 1 from public.profiles p where p.id = student_id and p.institution_id = public.current_institution_id()));
create policy "Trainers read assigned student resumes" on public.resumes for select to authenticated
  using (public.current_role() = 'trainer' and exists (select 1 from public.batch_members bm join public.batch_trainers bt on bt.batch_id = bm.batch_id
    where bm.student_id = resumes.student_id and bt.trainer_id = auth.uid()));
create policy "Resume owners read analyses" on public.resume_analyses for select to authenticated
  using (exists (select 1 from public.resumes r where r.id = resume_id and (
    r.student_id = auth.uid()
    or public.current_role() = 'admin' and exists (select 1 from public.profiles p where p.id = r.student_id and p.institution_id = public.current_institution_id())
    or public.current_role() = 'trainer' and exists (select 1 from public.batch_members bm join public.batch_trainers bt on bt.batch_id = bm.batch_id
      where bm.student_id = r.student_id and bt.trainer_id = auth.uid()))));
create policy "Students read own interviews" on public.interviews for select to authenticated using (student_id = auth.uid());
create policy "Students manage own interviews" on public.interviews for all to authenticated using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "Staff read institution interviews" on public.interviews for select to authenticated
  using ((public.current_role() = 'admin' and exists (select 1 from public.profiles p where p.id = student_id and p.institution_id = public.current_institution_id()))
    or (public.current_role() = 'trainer' and exists (select 1 from public.batch_members bm join public.batch_trainers bt on bt.batch_id = bm.batch_id
      where bm.student_id = interviews.student_id and bt.trainer_id = auth.uid())));
create policy "Interview participants read messages" on public.interview_messages for select to authenticated
  using (exists (select 1 from public.interviews i where i.id = interview_id and i.student_id = auth.uid()));
create policy "Staff read institution interview messages" on public.interview_messages for select to authenticated
  using (exists (select 1 from public.interviews i where i.id = interview_id and (
    public.current_role() = 'admin' and exists (select 1 from public.profiles p where p.id = i.student_id and p.institution_id = public.current_institution_id())
    or public.current_role() = 'trainer' and exists (select 1 from public.batch_members bm join public.batch_trainers bt on bt.batch_id = bm.batch_id
      where bm.student_id = i.student_id and bt.trainer_id = auth.uid()))));
create policy "Students create interview messages" on public.interview_messages for insert to authenticated
  with check (role = 'user' and exists (select 1 from public.interviews i where i.id = interview_id and i.student_id = auth.uid()));
create policy "Interview owners read reports" on public.interview_reports for select to authenticated
  using (exists (select 1 from public.interviews i where i.id = interview_id and i.student_id = auth.uid()));
create policy "Staff read institution interview reports" on public.interview_reports for select to authenticated
  using (exists (select 1 from public.interviews i where i.id = interview_id and (
    public.current_role() = 'admin' and exists (select 1 from public.profiles p where p.id = i.student_id and p.institution_id = public.current_institution_id())
    or public.current_role() = 'trainer' and exists (select 1 from public.batch_members bm join public.batch_trainers bt on bt.batch_id = bm.batch_id
      where bm.student_id = i.student_id and bt.trainer_id = auth.uid()))));
create policy "Authenticated users read badges" on public.badges for select to authenticated using (true);
create policy "Students read own badges" on public.user_badges for select to authenticated using (student_id = auth.uid());
create policy "Staff read institution student badges" on public.user_badges for select to authenticated
  using ((public.current_role() = 'admin' and exists (select 1 from public.profiles p where p.id = student_id and p.institution_id = public.current_institution_id()))
    or (public.current_role() = 'trainer' and exists (select 1 from public.batch_members bm join public.batch_trainers bt on bt.batch_id = bm.batch_id
      where bm.student_id = user_badges.student_id and bt.trainer_id = auth.uid())));
create policy "Students read own points" on public.points_ledger for select to authenticated using (student_id = auth.uid());
create policy "Staff read institution student points" on public.points_ledger for select to authenticated
  using ((public.current_role() = 'admin' and exists (select 1 from public.profiles p where p.id = student_id and p.institution_id = public.current_institution_id()))
    or (public.current_role() = 'trainer' and exists (select 1 from public.batch_members bm join public.batch_trainers bt on bt.batch_id = bm.batch_id
      where bm.student_id = points_ledger.student_id and bt.trainer_id = auth.uid())));
create policy "Students read own streak" on public.streaks for select to authenticated using (student_id = auth.uid());
create policy "Staff read institution student streaks" on public.streaks for select to authenticated
  using ((public.current_role() = 'admin' and exists (select 1 from public.profiles p where p.id = student_id and p.institution_id = public.current_institution_id()))
    or (public.current_role() = 'trainer' and exists (select 1 from public.batch_members bm join public.batch_trainers bt on bt.batch_id = bm.batch_id
      where bm.student_id = streaks.student_id and bt.trainer_id = auth.uid())));
create policy "Institution members read companies" on public.companies for select to authenticated using (institution_id = public.current_institution_id());
create policy "Institution members read roadmaps" on public.company_roadmaps for select to authenticated using (exists (select 1 from public.companies c where c.id = company_id and c.institution_id = public.current_institution_id()));
create policy "Institution members read announcements" on public.announcements for select to authenticated using (institution_id = public.current_institution_id());
create policy "Admins manage announcements" on public.announcements for all to authenticated
  using (public.current_role() = 'admin' and institution_id = public.current_institution_id())
  with check (public.current_role() = 'admin' and institution_id = public.current_institution_id());

create or replace function public.get_batch_leaderboard(target_batch uuid)
returns table (student_id uuid, points bigint, rank bigint, total_students bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.batch_members bm where bm.batch_id = target_batch and bm.student_id = auth.uid()) then
    raise exception 'You are not a member of this batch';
  end if;
  return query
    with totals as (
      select bm.student_id, coalesce(sum(pl.points), 0)::bigint as point_total
      from public.batch_members bm
      left join public.points_ledger pl on pl.student_id = bm.student_id
      where bm.batch_id = target_batch
      group by bm.student_id
    )
    select totals.student_id, totals.point_total,
      dense_rank() over (order by totals.point_total desc),
      count(*) over ()::bigint
    from totals
    order by totals.point_total desc, totals.student_id;
end;
$$;
grant execute on function public.get_batch_leaderboard(uuid) to authenticated;

insert into storage.buckets (id, name, public) values ('placement-content', 'placement-content', false)
on conflict (id) do nothing;
create policy "Institution users read placement content" on storage.objects for select to authenticated
  using (bucket_id = 'placement-content' and name like public.current_institution_id()::text || '/%');
create policy "Staff upload placement content" on storage.objects for insert to authenticated
  with check (bucket_id = 'placement-content' and public.current_role() in ('trainer', 'admin') and name like public.current_institution_id()::text || '/%');

revoke select on public.questions from anon, authenticated;
grant select (id, institution_id, created_by, topic, difficulty, type, prompt, options, created_at) on public.questions to authenticated;
