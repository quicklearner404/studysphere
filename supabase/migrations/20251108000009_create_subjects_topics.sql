-- Create subjects and topics for quizzes and add topic_id to quizzes (if not present)

-- Subjects
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone not null default now()
);

-- Topics belong to subjects
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone not null default now()
);

-- Add topic_id to quizzes if the column is not present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quizzes' AND column_name='topic_id') THEN
    ALTER TABLE public.quizzes ADD COLUMN topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Optional seed
-- insert into public.subjects (name, description) values ('Mathematics', 'Math courses and topics');
-- with s as (select id from public.subjects where name='Mathematics' limit 1)
-- insert into public.topics (subject_id, name) select s.id, 'Algebra' from s;
