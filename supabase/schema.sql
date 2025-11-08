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


