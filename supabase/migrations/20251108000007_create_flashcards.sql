-- Migration: create flashcard_decks and flashcards for UC-14
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
  created_at timestamp with time zone not null default now()
);
