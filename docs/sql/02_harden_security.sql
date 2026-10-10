-- 02 Security hardening (DB-002, DB-003, DB-004, DB-005, DB-006, storage part of DB-001)
-- Idempotent. Apply in the Supabase SQL editor, or copy to
-- supabase/migrations/20261006120000_harden_security.sql and run `supabase db push`.
-- Requires the app code in this repo (FeedbackChat no longer stores bot replies).

-- Grants for tables from the early migrations
grant insert on public.feedback_messages, public.contact_submissions to anon, authenticated;
grant select, update, delete on public.feedback_messages, public.contact_submissions to authenticated;
grant select on public.user_roles to authenticated;
grant all on public.feedback_messages, public.contact_submissions, public.user_roles to service_role;
revoke select, update, delete on public.feedback_messages, public.contact_submissions from anon;

-- feedback_messages: private reads, user-only inserts, admin delete
drop policy if exists "Public read access to feedback messages" on public.feedback_messages;
drop policy if exists "Anyone can insert feedback messages" on public.feedback_messages;
drop policy if exists "Admins read feedback" on public.feedback_messages;
drop policy if exists "Anyone can insert user feedback" on public.feedback_messages;
drop policy if exists "Admins delete feedback" on public.feedback_messages;

create policy "Admins read feedback" on public.feedback_messages
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Anyone can insert user feedback" on public.feedback_messages
  for insert to anon, authenticated
  with check (type = 'user' and char_length(message) between 1 and 2000);
create policy "Admins delete feedback" on public.feedback_messages
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- contact_submissions: length limits, status forced to 'new'
drop policy if exists "Anyone can insert contact submissions" on public.contact_submissions;
create policy "Anyone can insert contact submissions" on public.contact_submissions
  for insert to anon, authenticated
  with check (
    status = 'new'
    and char_length(name) between 1 and 100
    and char_length(email) between 3 and 255
    and char_length(subject) between 1 and 200
    and char_length(message) between 1 and 5000
  );

-- Indexes
create index if not exists contact_submissions_created_at_idx on public.contact_submissions (created_at desc);
create index if not exists feedback_messages_created_at_idx on public.feedback_messages (created_at desc);
create index if not exists skills_category_id_idx on public.skills (category_id);

-- Storage buckets + admin-only write policies
insert into storage.buckets (id, name, public) values
  ('documents','documents',true), ('project-images','project-images',true), ('skill-icons','skill-icons',true)
on conflict (id) do nothing;

drop policy if exists "Public read site buckets" on storage.objects;
drop policy if exists "Admins insert site buckets" on storage.objects;
drop policy if exists "Admins update site buckets" on storage.objects;
drop policy if exists "Admins delete site buckets" on storage.objects;

create policy "Public read site buckets" on storage.objects
  for select using (bucket_id in ('documents','project-images','skill-icons'));
create policy "Admins insert site buckets" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('documents','project-images','skill-icons') and public.has_role(auth.uid(),'admin'));
create policy "Admins update site buckets" on storage.objects
  for update to authenticated
  using (bucket_id in ('documents','project-images','skill-icons') and public.has_role(auth.uid(),'admin'))
  with check (bucket_id in ('documents','project-images','skill-icons') and public.has_role(auth.uid(),'admin'));
create policy "Admins delete site buckets" on storage.objects
  for delete to authenticated
  using (bucket_id in ('documents','project-images','skill-icons') and public.has_role(auth.uid(),'admin'));

-- After running, review older dashboard-created storage policies (permissive policies are OR-ed):
--   select policyname, cmd, qual, with_check from pg_policies
--   where schemaname = 'storage' and tablename = 'objects';
-- Drop any that let non-admin users write to these buckets.
