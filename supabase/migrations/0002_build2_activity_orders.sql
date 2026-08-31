-- Build 2 — activity_log + orders (the pipeline history and the money).
-- Safe to run more than once (idempotent).

-- activity_log: one row per Contacts status change (from_status → to_status).
create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  person_id   uuid references public.people(id) on delete set null,
  from_status text,
  to_status   text,
  actor       text,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists activity_log_contact_id_idx on public.activity_log (contact_id);
create index if not exists activity_log_person_id_idx  on public.activity_log (person_id);
create index if not exists activity_log_created_at_idx on public.activity_log (created_at desc);

-- orders: what people bought.
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references public.people(id) on delete cascade,
  product_name text not null,
  amount_cents integer not null default 0 check (amount_cents >= 0),
  currency     text not null default 'AUD',
  status       text not null default 'pending'
               check (status in ('pending','paid','refunded','cancelled')),
  created_at   timestamptz not null default now()
);

create index if not exists orders_person_id_idx  on public.orders (person_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Lock everything down, same as Build 1. All app access is server-side with the
-- service-role key (bypasses RLS). RLS on + no policies = anon key reads nothing.
alter table public.activity_log enable row level security;
alter table public.orders       enable row level security;
