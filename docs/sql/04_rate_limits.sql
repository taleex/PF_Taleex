-- 04 Persistent rate limits (BUG-003 / DB-008). Idempotent.
-- Used only by edge functions through the service role.

create table if not exists public.rate_limits (
  id bigserial primary key,
  bucket text not null,
  client_key text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limits_lookup_idx
  on public.rate_limits (bucket, client_key, created_at desc);

revoke all on public.rate_limits from anon, authenticated;
grant all on public.rate_limits to service_role;
grant usage, select on sequence public.rate_limits_id_seq to service_role;
alter table public.rate_limits enable row level security;
-- No policies: only service_role (which bypasses RLS) can touch it.

-- Returns true if allowed (and records the hit), false if over the limit.
create or replace function public.hit_rate_limit(
  _bucket text, _client_key text, _max integer, _window_seconds integer
) returns boolean
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from public.rate_limits
   where created_at < now() - make_interval(secs => greatest(_window_seconds, 86400));
  select count(*) into n from public.rate_limits
   where bucket = _bucket and client_key = _client_key
     and created_at > now() - make_interval(secs => _window_seconds);
  if n >= _max then return false; end if;
  insert into public.rate_limits (bucket, client_key) values (_bucket, _client_key);
  return true;
end; $$;

revoke execute on function public.hit_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, text, integer, integer) to service_role;
