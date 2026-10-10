# Supabase Runbook

_Last updated: 2026-10-10 · Project ref: `ooefpodiqdupfpyqmaif` (external Supabase project, connected through `.env`)_

The goal is to rebuild the database from the repo, keep it locked down, and make future changes go through reviewed SQL.

## 1. What's already done in code
| ID | Change | File |
|---|---|---|
| BUG-001 | The recipient comes from the `CONTACT_EMAIL` secret (it was a placeholder). Optional `CONTACT_FROM` secret sets the sender. Added reply-to for the visitor's email | `supabase/functions/send-contact-email/index.ts` |
| BUG-002 | All fields are HTML-escaped and validated on the server for type, length and email format. The subject has newlines stripped | same |
| BUG-008 | Removed `any` and return a generic error instead of the raw provider error | same |
| ORG-005 | Removed the hardcoded personal alert email; `ALERT_EMAIL` is now required | `supabase/functions/send-error-report/index.ts` |
| DB-002 (client) | Stopped saving bot replies. Only real user messages are stored | `src/components/FeedbackChat.tsx` |
| BUG-003 / DB-008 | Rate limits now stored in the DB via `hit_rate_limit()`; error-report throttled and HTML-escaped. Fails open until 04 is applied | `supabase/functions/_shared/rateLimit.ts`, both functions |
| DB-003 (client) | Deletes now check the returned rows, so a blocked delete shows an error instead of fake success | `src/components/admin/MessagesViewer.tsx` |

## 2. What you need to apply (in order)
Lovable can't run SQL on an external Supabase project, so the scripts are in `docs/sql/`.

1. **Back up first:** Dashboard → Database → Backups (or `supabase db dump -f backup.sql`).
2. **Run `docs/sql/01_baseline_schema.sql`.** It's idempotent and a no-op on the live DB. It records the 9 tables that were created in the dashboard.
3. **Run `docs/sql/02_harden_security.sql`.** This makes feedback private, adds the admin delete policy and contact length limits, and adds grants, indexes, and buckets with admin-only write policies.
4. **Run `docs/sql/03_verify.sql`** and check the results. No table should be missing RLS. `skills.category_id` should have an FK. There should be at least 1 admin.
5. **Review storage policies** in the output of step 4. Drop any older policy that lets non-admin users write.
5b. **Run `docs/sql/04_rate_limits.sql`** (rate-limit table + function, service-role only).
6. **Set edge function secrets:** `supabase secrets set CONTACT_EMAIL=you@domain ALERT_EMAIL=you@domain RESEND_API_KEY=...`. Optionally set `CONTACT_FROM="Portfolio <hi@yourdomain>"` (it must be a domain verified in Resend).
7. **Deploy the functions:** `supabase functions deploy send-contact-email send-error-report`.
8. **Record the scripts as migrations** so the repo stays the source of truth:
   - `cp docs/sql/01_baseline_schema.sql supabase/migrations/20251001000000_baseline_schema.sql`
   - `cp docs/sql/02_harden_security.sql supabase/migrations/20261006120000_harden_security.sql`
   - `supabase migration repair --status applied 20251001000000 20261006120000` (marks them as already run)
9. **Regenerate types:** `supabase gen types typescript --project-id ooefpodiqdupfpyqmaif > src/integrations/supabase/types.ts`

## 3. Rules for future changes
- Every schema change goes in a new file in `supabase/migrations/`. Never change the schema only in the dashboard.
- Each new public table needs, in this order: `CREATE TABLE`, then `GRANT` for the needed roles plus `service_role`, then `ENABLE ROW LEVEL SECURITY`, then the policies.
- Write access uses `public.has_role(auth.uid(), 'admin')`. Never check roles on the client only.
- Seed or demo data goes in `supabase/seed.sql`, never in migrations (see DB-007).
- After any schema change, regenerate `types.ts` (step 9).
- Secrets live only in Supabase function secrets. `.env` holds only the URL and the publishable (anon) key.

## 4. Still open (Supabase-related)
- **DB-007:** The skills seed migration (`20251002143047`) deletes data if it's replayed. Move it to `seed.sql` when you rebuild a fresh environment.
- **UX-005:** Upload type and size limits in the other admin screens (CV upload is done).
