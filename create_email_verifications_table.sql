-- Creates a table to store email verification codes
create table if not exists public.email_verifications (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS and basic policies for app usage
alter table public.email_verifications enable row level security;

-- Only service role can insert/update by default; allow reads of own pending state if needed
do $$ begin
  create policy if not exists "allow_select_verified_by_anyone" on public.email_verifications
    for select using (true);
exception when others then null; end $$;


