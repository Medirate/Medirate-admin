-- Simple IP throttle table for email verification requests
create table if not exists public.email_verification_ip_throttle (
  ip text primary key,
  window_start timestamptz not null,
  count integer not null default 0
);

alter table public.email_verification_ip_throttle enable row level security;

-- Service role writes; reads unrestricted (non-sensitive)
do $$ begin
  create policy if not exists "select throttle" on public.email_verification_ip_throttle
    for select using (true);
exception when others then null; end $$;


