-- Build 1 — People + Contacts (the smallest data model that proves the lead loop)
-- Safe to run more than once (idempotent).

-- People: contact directory, one row per person, deduplicated by email.
create table if not exists public.people (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text,
  phone         text,
  company       text,
  role          text,
  source_site   text,
  ok_to_contact boolean not null default false,
  attributes    jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Contacts: inquiry pipeline. Each inquiry links to a person and moves through stages.
create table if not exists public.contacts (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references public.people(id) on delete cascade,
  type       text not null check (type in ('consulting','membership','training','general')),
  subject    text,
  message    text,
  source     text,
  status     text not null default 'new_lead'
             check (status in ('new_lead','contacted','discovery_call','proposal','won','lost')),
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists contacts_created_at_idx on public.contacts (created_at desc);
create index if not exists contacts_person_id_idx  on public.contacts (person_id);
create index if not exists contacts_status_idx     on public.contacts (status);

-- Keep people.updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists people_set_updated_at on public.people;
create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

-- Lock everything down. All app access is server-side with the service-role key,
-- which bypasses RLS. With RLS enabled and no policies, the public anon key can
-- read/write nothing directly.
alter table public.people   enable row level security;
alter table public.contacts enable row level security;
