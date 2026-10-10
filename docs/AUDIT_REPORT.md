# Technical Audit Report — Taleex Portfolio

_Audit date: 2026-10-02 · Updated 2026-10-06: fixes for BUG-001/002/004/008, ORG-005 and the client side of DB-002/003 are in code. The SQL for DB-001–006 is in `docs/sql/`, waiting to be applied (see `SUPABASE_RUNBOOK.md`)._

## 1. Executive summary

| Area | Health (1–10) | Notes |
|---|---|---|
| Bugs | 6 | Type-check passes; main risks are in the edge functions and admin flows |
| Organization | 6 | Clear hooks/components split, but admin editors are oversized and fetch data in different ways |
| Supabase / DB | 4 | Migrations can't rebuild the schema; feedback is public; one admin delete is silently blocked |
| UI/UX | 7 | Good loading and error handling on public pages; admin has rough edges |

**Top 5 priorities**
1. DB-002: `feedback_messages` can be read and written by anyone, and anyone can post fake "bot" messages.
2. BUG-001: The contact email goes to a placeholder address (`your-email@example.com`), so the owner never gets submissions.
3. DB-001: The migrations can't recreate the database. Core tables and storage buckets are missing from them.
4. BUG-002: Contact form text is put into the email HTML without escaping (HTML injection).
5. DB-003: Admin "delete feedback" has no DELETE policy, so it fails silently. The UI shows success but nothing is deleted.

## 2. Project overview

- **Purpose:** Personal portfolio (about, experience, skills, projects, contact) with a feedback chat and an admin dashboard for editing content.
- **Stack:** React 18, Vite 5, TypeScript, Tailwind, shadcn/ui, TanStack Query, react-router-dom. Uses an external Supabase project (`ooefpodiqdupfpyqmaif`) that you manage yourself, connected through `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`).
- **Structure:** `src/pages` (Index, ProjectsPage, Auth, Admin, NotFound, ServiceUnavailable), `src/components/{about,contact,experience,projects,skills,layout,admin,ui}`, `src/hooks` (data and form hooks), `src/data` (static fallbacks), `src/lib` (error utilities), `supabase/functions`, `supabase/migrations` (5 files).
- **Routes** (`src/App.tsx`): `/`, `/projects`, `/auth`, `/admin/*` (wrapped in `ProtectedRoute`), `/service-unavailable`, `*`.
- **Data flow:** Public pages read data through TanStack Query hooks (`useProfile`, `useProjects`, `useExperiences`, `useSkills`, `useContactInfo`, `usePageSections`, `useSiteContent`, `useSiteImages`). They fall back to static `src/data/*` when there's no data. Admin editors call `supabase` directly with local `useState`. The global `QueryCache.onError` sends errors to `notifySupabaseError`, which calls the `send-error-report` function.
- **Supabase usage:**
  - Tables: profiles, projects, experiences, skills, skill_categories, contact_info, page_sections, site_content, site_images, contact_submissions, feedback_messages, user_roles
  - RPC `has_role` (used in policies only)
  - Auth: `signInWithPassword` and `resetPasswordForEmail` (`useAuthForm.ts`), session handling (`useAuth.ts`)
  - Storage buckets: `documents`, `project-images`, `skill-icons`
  - Edge functions: `send-contact-email`, `send-error-report`
  - Realtime: none

## 3. Findings

### A. Bugs

- **ID:** BUG-001
- **Severity:** Critical
- **Location:** `supabase/functions/send-contact-email/index.ts` (`to: ["your-email@example.com"]`)
- **Problem:** The recipient is a placeholder. The sender is `onboarding@resend.dev`, which only delivers to the Resend account owner.
- **Impact:** Contact notifications never reach the site owner.
- **Suggested fix:** Read the recipient from a `CONTACT_EMAIL` secret (as `send-error-report` does with `ALERT_EMAIL`). Use a verified sender domain.
- **Effort:** S
- **Status:** Open

- **ID:** BUG-002
- **Severity:** High
- **Location:** `supabase/functions/send-contact-email/index.ts` (html template)
- **Problem:** `name`, `email`, `subject` and `message` go into the HTML without escaping. There's no length or email-format check on the server.
- **Impact:** Anyone can inject HTML or links into the owner's inbox, and very large payloads are accepted.
- **Suggested fix:** Escape `& < > " '`, check lengths with zod, and validate the email format.
- **Effort:** S
- **Status:** Open

- **ID:** BUG-003
- **Severity:** Medium
- **Location:** `supabase/functions/send-contact-email/index.ts` (`submissionLimits` Map, `getClientId`)
- **Problem:** The rate limit is kept in memory, so it resets on every cold start and isn't shared between instances. Without `x-forwarded-for`, all clients share the `"unknown-client"` bucket. Submissions are only counted after an email sends successfully, so failed attempts are never limited.
- **Impact:** The limit is easy to get around, and it could also block legitimate users.
- **Suggested fix:** Store rate-limit counts in a table, or keep the existing client-side `useRateLimit` and add a DB-backed check.
- **Effort:** M
- **Status:** Open

- **ID:** BUG-004
- **Severity:** Medium
- **Location:** `src/hooks/useContactForm.ts:132–148`
- **Problem:** The row is inserted into `contact_submissions` first, then the email function is called. If the email fails (it always does today, see BUG-001), the stored row stays but the result the user sees is unclear. _Needs verification:_ the exact success and failure messages depend on the branch after line 148.
- **Impact:** The user might see an error even though the message was saved, and could resubmit and create duplicates.
- **Suggested fix:** Treat the DB insert as the success point. Report email failure separately (log it or show a non-blocking warning).
- **Effort:** S
- **Status:** Open

- **ID:** BUG-005
- **Severity:** Medium
- **Location:** `src/hooks/useUserRole.ts` (module-level `roleCache`)
- **Problem:** Admin status is cached for 5 minutes per user ID and never cleared on sign-out or role change. The `if (!user)` branch also doesn't reset `loading` to `true` before a later check.
- **Impact:** Role changes show up late in the UI. This is low security risk because RLS still enforces access.
- **Suggested fix:** Clear the cache in `useAuth.signOut` and on the `SIGNED_OUT` event, or move the role check into TanStack Query keyed by user ID.
- **Effort:** S
- **Status:** Open

- **ID:** BUG-006
- **Severity:** Low
- **Location:** `src/App.tsx` (QueryClient `retry`)
- **Problem:** `supabaseError.code === "PGRST"` never matches, because real codes look like `PGRST116`. `message.includes("supabase")` almost never matches either. So Supabase errors are retried 3 times despite the comment saying otherwise.
- **Impact:** Slower error screens and extra calls to the error-report function.
- **Suggested fix:** Use `code?.startsWith("PGRST")` or reuse `isSupabaseError` from `src/lib/supabase-error.ts`.
- **Effort:** S
- **Status:** Open

- **ID:** BUG-007
- **Severity:** Low
- **Location:** `src/components/admin/profile/ProfileCVUpload.tsx:26–38`
- **Problem:** The file path is `cv-${profileId}.${ext}` with `upsert: true`, and there's no file type or size check. When the extension changes, the old file is left behind. The public URL stays the same, so browsers may keep showing a cached old CV.
- **Impact:** Leftover files in storage and an outdated CV for visitors.
- **Suggested fix:** Accept PDF only with a size limit, and add a cache-busting query string or a timestamp in the filename.
- **Effort:** S
- **Status:** Open

- **ID:** BUG-008
- **Severity:** Low
- **Location:** `supabase/functions/send-contact-email/index.ts` (`catch (error: any)`), `src/components/admin/ExperiencesEditor.tsx` (7 `any` matches), `src/data/experience.ts` (4)
- **Problem:** `any` is used in error handling and in data typing.
- **Impact:** Type errors go unnoticed and the error message may leak internals (the raw Resend error is returned to the client).
- **Suggested fix:** Use `unknown` with `getErrorMessage`. Return a generic error message to the client.
- **Effort:** S
- **Status:** Open

### B. Organization and architecture

- **ID:** ORG-001
- **Severity:** Medium
- **Location:** `src/components/admin/ProjectsEditor.tsx` (638 lines), `SkillsEditor.tsx` (547), `MessagesViewer.tsx` (464), `ExperiencesEditor.tsx` (385)
- **Problem:** Each editor mixes fetching, uploads, CRUD and rendering in one file.
- **Impact:** Hard to change and test, and logic gets duplicated.
- **Suggested fix:** Move CRUD into hooks (e.g. `useAdminProjects`) built on TanStack Query mutations, and move uploads into a shared `uploadToBucket` utility.
- **Effort:** L
- **Status:** Open

- **ID:** ORG-002
- **Severity:** Medium
- **Location:** Public hooks (`useProjects`, `useSkills`, …) vs admin editors
- **Problem:** Public pages use TanStack Query, while admin uses `useState` with manual fetches. Admin changes don't invalidate the public query cache, which has a 5-minute `staleTime`.
- **Impact:** After saving in admin, public pages show old data in the same session.
- **Suggested fix:** Use the same query keys in admin and call `invalidateQueries` after mutations.
- **Effort:** M
- **Status:** Open

- **ID:** ORG-003
- **Severity:** Low
- **Location:** `ExperiencesEditor.tsx:281`, `ProjectsEditor.tsx:536`, `SkillsEditor.tsx:420` use `confirm()`; `MessagesViewer.tsx` uses `AlertDialog`
- **Problem:** Delete confirmations use two different patterns.
- **Impact:** Inconsistent UX and harder to test.
- **Suggested fix:** Make a shared `ConfirmDeleteDialog` component.
- **Effort:** S
- **Status:** Open

- **ID:** ORG-004
- **Severity:** Low
- **Location:** `src/data/skills.ts` vs `src/hooks/useSkills.ts`; local `SkillCategory` interface in `ProjectsEditor.tsx:67–73`
- **Problem:** The static fallback and DB types are defined separately (the static data has no `id`), and a local interface duplicates them.
- **Impact:** Types drift apart, which caused the recent build errors.
- **Suggested fix:** Create a shared `src/types/content.ts` based on `Database['public']['Tables']`.
- **Effort:** S
- **Status:** Open

- **ID:** ORG-005
- **Severity:** Low
- **Location:** `supabase/functions/send-error-report/index.ts` (`ALERT_EMAIL ?? "matosjax@gmail.com"`)
- **Problem:** A personal email is hardcoded as the fallback in source code.
- **Impact:** Personal data in the repo, and the alert address can't be changed through config.
- **Suggested fix:** Require the `ALERT_EMAIL` secret and fail clearly if it's missing.
- **Effort:** S
- **Status:** Open

### C. Supabase and database

- **ID:** DB-001
- **Severity:** High
- **Location:** `supabase/migrations/*` (5 files)
- **Problem:** The code and `types.ts` reference 9 tables that no migration creates: `profiles, projects, experiences, skills, skill_categories, contact_info, page_sections, site_content, site_images`. The migrations only `ALTER` them or add policies, and a seed migration runs `DELETE FROM skills`. Storage buckets `documents`, `project-images` and `skill-icons` have no migration or storage policies. They were probably created in the dashboard.
- **Impact:** A fresh environment can't be built from the repo, and storage policies can't be reviewed.
- **Suggested fix:** Export the current schema (`supabase db pull`) into a baseline migration. Add bucket and policy SQL, for example:
  ```sql
  insert into storage.buckets (id, name, public) values
    ('documents','documents',true),('project-images','project-images',true),('skill-icons','skill-icons',true)
  on conflict (id) do nothing;
  create policy "Public read site buckets" on storage.objects for select
    using (bucket_id in ('documents','project-images','skill-icons'));
  create policy "Admins write site buckets" on storage.objects for all to authenticated
    using (bucket_id in ('documents','project-images','skill-icons') and public.has_role(auth.uid(),'admin'))
    with check (bucket_id in ('documents','project-images','skill-icons') and public.has_role(auth.uid(),'admin'));
  ```
- **Effort:** M
- **Status:** Open (storage policies: Needs verification, because they can't be read with the anon key)

- **ID:** DB-002
- **Severity:** Critical
- **Location:** `feedback_messages` policies (first migration); `src/components/FeedbackChat.tsx:99–137`
- **Problem:** `SELECT USING (true)` means anyone can read all feedback. I confirmed this live: an anonymous REST call returned rows. `INSERT WITH CHECK (true)` with no length limit, plus the client inserting `type='bot'` rows, means anyone can post fake bot messages or spam.
- **Impact:** Feedback is exposed publicly, and spam or abuse is possible.
- **Suggested fix:**
  ```sql
  drop policy "Public read access to feedback messages" on public.feedback_messages;
  create policy "Admins read feedback" on public.feedback_messages for select to authenticated
    using (public.has_role(auth.uid(),'admin'));
  drop policy "Anyone can insert feedback messages" on public.feedback_messages;
  create policy "Anyone can insert user feedback" on public.feedback_messages for insert
    with check (type = 'user' and char_length(message) between 1 and 2000);
  ```
  Also stop saving bot replies from the client.
- **Effort:** S
- **Status:** Open

- **ID:** DB-003
- **Severity:** High
- **Location:** `src/components/admin/MessagesViewer.tsx:126–137`; `feedback_messages` policies
- **Problem:** There's no DELETE policy on `feedback_messages`. Under RLS, the delete affects 0 rows and returns no error, so the UI removes the item and shows "deleted successfully".
- **Impact:** The admin thinks feedback was deleted when it wasn't.
- **Suggested fix:**
  ```sql
  create policy "Admins delete feedback" on public.feedback_messages for delete to authenticated
    using (public.has_role(auth.uid(),'admin'));
  ```
  Also use `.delete().select()` and check the returned row count.
- **Effort:** S
- **Status:** Open

- **ID:** DB-004
- **Severity:** Medium
- **Location:** `contact_submissions` insert policy
- **Problem:** `WITH CHECK (true)` with no length limit or email check.
- **Impact:** Spam and very large rows.
- **Suggested fix:**
  ```sql
  drop policy "Anyone can insert contact submissions" on public.contact_submissions;
  create policy "Anyone can insert contact submissions" on public.contact_submissions for insert
    with check (char_length(name) <= 100 and char_length(email) <= 255 and char_length(subject) <= 200
      and char_length(message) <= 5000 and status = 'new');
  ```
- **Effort:** S
- **Status:** Open

- **ID:** DB-005
- **Severity:** Medium
- **Location:** All public tables
- **Problem:** No migration has `GRANT` statements. Newer Supabase projects don't grant `anon` or `authenticated` access to `public` by default. Access works today (confirmed with live REST calls), but a rebuilt environment would break.
- **Impact:** Rebuilding the environment would fail.
- **Suggested fix:** In the baseline migration, add `grant select on <public content tables> to anon, authenticated; grant insert on contact_submissions, feedback_messages to anon, authenticated; grant all on all tables in schema public to service_role;` and grant select/insert/update/delete to `authenticated` for admin tables.
- **Effort:** S
- **Status:** Open

- **ID:** DB-006
- **Severity:** Low
- **Location:** `contact_submissions`, `feedback_messages`, `skills.category_id`
- **Problem:** There's no index on `created_at`, even though admin lists sort by date. Whether `skills.category_id` has an FK, index or `ON DELETE` rule is unknown because the table isn't in the migrations.
- **Impact:** Slower queries as data grows, and orphaned skills if a category is deleted.
- **Suggested fix:**
  ```sql
  create index if not exists contact_submissions_created_at_idx on public.contact_submissions (created_at desc);
  create index if not exists feedback_messages_created_at_idx on public.feedback_messages (created_at desc);
  create index if not exists skills_category_id_idx on public.skills (category_id);
  ```
- **Effort:** S
- **Status:** Open (FK part: Needs verification)

- **ID:** DB-007
- **Severity:** Low
- **Location:** Migration 2 (skills seed)
- **Problem:** A data migration runs `DELETE FROM skills; DELETE FROM skill_categories;`. It inserts "Airbyte" in two categories and uses `SiReact` for Lovable.dev.
- **Impact:** Replaying migrations wipes any skills edited in admin.
- **Suggested fix:** Move seed data to `supabase/seed.sql`, and make it idempotent (`on conflict do nothing`).
- **Effort:** S
- **Status:** Open

- **ID:** DB-008
- **Severity:** Low
- **Location:** `supabase/config.toml`
- **Problem:** No `[functions.*]` settings. `verify_jwt` defaults to true, so both functions only accept requests carrying the anon key. That works, but the rate limiting depends on that anon key.
- **Impact:** Anyone with the public anon key can call `send-error-report` and send unlimited alert emails.
- **Suggested fix:** Add server-side throttling or deduplication in `send-error-report`.
- **Effort:** S
- **Status:** Open

- **Auth note (no finding):** The admin route is guarded on the client (`ProtectedRoute` + `useUserRole`), and every write is also enforced by `has_role` RLS. Roles are kept in a separate `user_roles` table. This is correct.

### D. UI/UX

- **ID:** UX-001
- **Severity:** Medium
- **Location:** `ExperiencesEditor.tsx:281`, `ProjectsEditor.tsx:536`, `SkillsEditor.tsx:420`
- **Problem:** Destructive actions use the browser's native `confirm()`.
- **Impact:** Dialogs don't match the design, and keyboard and screen-reader behavior varies by browser.
- **Suggested fix:** Use `AlertDialog`, the same as `MessagesViewer` (see ORG-003).
- **Effort:** S
- **Status:** Open

- **ID:** UX-002
- **Severity:** Medium
- **Location:** `ProtectedRoute.tsx`
- **Problem:** Users who aren't admins see a red alert with no way out (no sign-out button, no link home).
- **Impact:** Dead-end screen.
- **Suggested fix:** Add "Sign out" and "Back to site" buttons.
- **Effort:** S
- **Status:** Open

- **ID:** UX-003
- **Severity:** Low
- **Location:** Admin editors (see ORG-002)
- **Problem:** After saving, the public site keeps showing old content for up to 5 minutes.
- **Impact:** The admin may think saving failed.
- **Suggested fix:** Invalidate the related queries after saving.
- **Effort:** S
- **Status:** Open

- **ID:** UX-004
- **Severity:** Low
- **Location:** `SkillCard.tsx:52,59`, `ProfileCard.tsx:23`, `SkillsEditor.tsx:193,236`, `ProjectsEditor.tsx:273`
- **Problem:** These `<img>` tags span multiple lines. I didn't confirm the meaning or presence of each `alt` attribute.
- **Impact:** Possible accessibility gaps.
- **Suggested fix:** Make sure every image has a meaningful `alt` (or `alt=""` if decorative).
- **Effort:** S
- **Status:** Needs verification

- **ID:** UX-005
- **Severity:** Low
- **Location:** File inputs in `ProfileCVUpload.tsx`, `ProjectsEditor.tsx`, `SkillsEditor.tsx`
- **Problem:** No file type or size limits are shown or enforced before upload.
- **Impact:** Uploads fail with confusing errors, or large images make the site slow.
- **Suggested fix:** Add `accept` attributes and size checks with clear messages.
- **Effort:** S
- **Status:** Open

## 4. Suggested fix order

1. **Quick wins (S):** BUG-001, BUG-002, DB-002, DB-003, DB-004, BUG-006, ORG-005, UX-002
2. **Critical/structural:** DB-001, DB-005, BUG-003, DB-008, BUG-004
3. **Refactors:** ORG-002 / UX-003, ORG-001, ORG-003 / UX-001, ORG-004, BUG-005, DB-006, DB-007, BUG-007, BUG-008, UX-004, UX-005

## 5. Files removed from /docs (Step 0)

- `docs/APP_REVIEW.md` (previous full application review, dated 2026-08-26). It came back after the project was re-imported and was removed again on 2026-10-06.

## 6. Open questions / assumptions

- I couldn't check storage bucket policies and the live table definitions (FKs, indexes) with the anon key. A schema dump would confirm DB-001 and DB-006.
- I assumed the live database matches `src/integrations/supabase/types.ts` (12 tables, `has_role`, `app_role`).
- Is the `RESEND_API_KEY` secret set on the Supabase project? I couldn't check this.
- Should feedback be visible to the public (for example as a "guestbook")? DB-002 assumes it shouldn't be.
