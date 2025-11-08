-- Create quizzes, questions, options and attempts tables

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid references public.students(id) on delete set null,
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

-- Seed a sample quiz to try locally
insert into public.quizzes (id, title, description, created_at)
values
  (gen_random_uuid(), 'Intro to Algebra', 'Short MCQ quiz on basic algebra', now())
returning id;

-- Note: seeding questions/options with deterministic ids is helpful; we'll insert one quiz's content below by referencing the quiz we just created.

with q as (
  select id as quiz_id from public.quizzes where title = 'Intro to Algebra' limit 1
)
insert into public.quiz_questions (quiz_id, question_text, "order")
select quiz_id, 'What is the solution to 2x + 3 = 11?', 1 from q
returning id;

with q as (
  select id as quiz_id from public.quizzes where title = 'Intro to Algebra' limit 1
), qq as (
  select id as question_id from public.quiz_questions where question_text = 'What is the solution to 2x + 3 = 11?' limit 1
)
insert into public.quiz_options (question_id, option_text, is_correct)
select qq.question_id, vals.opt, vals.correct
from qq, (values
  ('x = 4', true),
  ('x = 5', false),
  ('x = 3', false),
  ('x = -4', false)
) as vals(opt, correct);

-- second question
with q as (
  select id as quiz_id from public.quizzes where title = 'Intro to Algebra' limit 1
)
insert into public.quiz_questions (quiz_id, question_text, "order")
select quiz_id, 'Simplify: 3(x - 2) + 4 =', 2 from q
returning id;

with qq as (
  select id as question_id from public.quiz_questions where question_text = 'Simplify: 3(x - 2) + 4 =' limit 1
)
insert into public.quiz_options (question_id, option_text, is_correct)
select qq.question_id, vals.opt, vals.correct
from qq, (values
  ('3x - 2', false),
  ('3x - 6 + 4', false),
  ('3x - 2', false),
  ('3x - 2', false),
  ('3x - 2', false),
  ('3x - 2 + 4', false),
  ('3x - 2', false),
  ('3x - 2', false)
) as vals(opt, correct);

-- Note: the second question was seeded with placeholder options; you can edit these rows in Supabase SQL editor to correct them or add more quizzes.
