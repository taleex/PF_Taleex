-- 03 Verification queries (read-only). Run after 01 and 02.

-- Tables without RLS (expect 0 rows)
select tablename from pg_tables
where schemaname = 'public' and not rowsecurity;

-- All policies
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname in ('public','storage') order by tablename, cmd;

-- Foreign keys (DB-006: expect skills.category_id -> skill_categories.id)
select conrelid::regclass as tbl, conname, pg_get_constraintdef(oid)
from pg_constraint where contype = 'f' and connamespace = 'public'::regnamespace;

-- Buckets
select id, public from storage.buckets;

-- At least one admin exists
select count(*) as admins from public.user_roles where role = 'admin';
