-- StudySphere - Core schema based on UML (Student focused)
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  points integer not null default 0,
  personal_stats jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists students_email_idx on public.students (email);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

-- Discussion feature tables
create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.students(id) on delete cascade,
  title text not null,
  body text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.discussion_answers (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid references public.discussions(id) on delete cascade,
  author_id uuid references public.students(id) on delete cascade,
  body text not null,
  created_at timestamp with time zone not null default now()
);

-- Keep updated_at for discussions in sync
drop trigger if exists discussions_set_updated_at on public.discussions;
create trigger discussions_set_updated_at
before update on public.discussions
for each row execute function public.set_updated_at();

-- Flashcards feature tables (UC-14: Flip Card Flashcards)
create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid references public.students(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid references public.flashcard_decks(id) on delete cascade,
  front text not null,
  back text not null,
  created_at timestamp with time zone not null default now(),
  -- Spaced Repetition fields (SM-2 basics)
  last_reviewed timestamp with time zone,
  repetition_count integer not null default 0,
  interval_days integer not null default 1,
  ease numeric(4,2) not null default 2.50,
  next_review_at timestamp with time zone not null default now()
);


-- Quizzes (MCQ) feature tables
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid references public.students(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes(id) on delete cascade,
  question_text text not null,
  "order" integer not null default 0
);

create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  score integer not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.quiz_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references public.quiz_attempts(id) on delete cascade,
  question_id uuid references public.quiz_questions(id) on delete cascade,
  selected_option_id uuid references public.quiz_options(id) on delete set null,
  is_correct boolean not null
);

-- RPC: atomic increment of student points
-- Returns the new points total (integer) or NULL if student not found
create or replace function public.increment_student_points(student_uuid uuid, delta integer)
returns integer as $$
declare
  new_points integer;
begin
  update public.students
  set points = coalesce(points,0) + delta,
      updated_at = now()
  where id = student_uuid;

  if found then
    select points into new_points from public.students where id = student_uuid;
    return new_points;
  else
    -- student row doesn't exist; do not create (registration should create students row).
    raise notice 'increment_student_points: student % not found', student_uuid;
    return null;
  end if;
end;
$$ language plpgsql security definer;



