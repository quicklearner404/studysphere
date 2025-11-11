-- Migration: add spaced-repetition fields to flashcards
-- Idempotent migration: uses IF NOT EXISTS for columns

alter table if exists public.flashcards
  add column if not exists last_reviewed timestamp with time zone;

alter table if exists public.flashcards
  add column if not exists repetition_count integer not null default 0;

alter table if exists public.flashcards
  add column if not exists interval_days integer not null default 1;

alter table if exists public.flashcards
  add column if not exists ease numeric(4,2) not null default 2.50;

alter table if exists public.flashcards
  add column if not exists next_review_at timestamp with time zone not null default now();

-- Backfill existing rows to sensible defaults if needed
update public.flashcards
set last_reviewed = coalesce(last_reviewed, now()),
    repetition_count = coalesce(repetition_count, 0),
    interval_days = coalesce(interval_days, 1),
    ease = coalesce(ease, 2.50),
    next_review_at = coalesce(next_review_at, now())
where true;
