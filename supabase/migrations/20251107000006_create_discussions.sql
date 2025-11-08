-- Create discussions and discussion_answers tables
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

-- Trigger to update updated_at
drop trigger if exists discussions_set_updated_at on public.discussions;
create trigger discussions_set_updated_at
before update on public.discussions
for each row execute function public.set_updated_at();
