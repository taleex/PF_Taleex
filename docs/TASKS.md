# Taleex Portfolio — Audit Tasks

**Last updated:** 2026-10-02

## Legend

- `- [x]` completed in this audit run (audit steps, `/docs` cleanup, report creation only — **no application code or DB changes**).
- `- [ ]` not yet done. All finding-fix tasks are unchecked because this is an audit-only run.
- Severity tags follow `/docs/AUDIT_REPORT.md`: **Critical**, **High**, **Medium**, **Low**.
- Grouped by area (Bugs / Organization / Supabase / UI-UX), ordered by severity within each area.
- IDs match the findings in `/docs/AUDIT_REPORT.md`.

---

## Audit Steps (Step 0–3)

- [x] Step 0: List every file currently in `/docs`.
- [x] Step 0: Delete all old files in `/docs` (AUDIT.md, IMPROVEMENT_PLAN.md, README.md, SUPABASE.md).
- [x] Step 1: Read the codebase and summarize purpose, stack, structure, routes, data flows, and Supabase usage.
- [x] Step 2A: Audit Bugs (runtime, effects, types, dead code, import flows).
- [x] Step 2B: Audit Organization & Architecture.
- [x] Step 2C: Audit Supabase & Database (tables/RLS/constraints/storage/edge functions vs migrations).
- [x] Step 2D: Audit UI/UX (states, forms, responsiveness, a11y, performance).
- [x] Step 3: Write `/docs/AUDIT_REPORT.md` (exec summary, overview, findings, fix order, removed files, open questions).
- [x] Step 4: Write `/docs/TASKS.md` (this file).

---

## Bugs

- [ ] BUG-001 (Critical): Make `send-contact-email` deliver to a real, verified recipient (env secret instead of `your-email@example.com`); surface email failures to the client.
- [ ] BUG-002 (High): Remove `maybeSingle()` ambiguity on `profiles` (public hook + Header query).
- [ ] BUG-003 (High): Honor `contact_info.show_publicly` in `useContactInfo`/`ContactInfo` so private phone is not shown.
- [ ] BUG-004 (Medium): Fix `useProjectFilters` effect deps and stop mutating `searchParams` in place.
- [ ] BUG-005 (Medium): Stop writing `experience_years: null` on every profile save in `ProfileEditor`.
- [ ] BUG-006 (Medium): Make `StructuredData` parse `period` defensively and not emit empty `skills`.
- [ ] BUG-007 (Medium): Add error handling to the Header CV query (distinguish error vs empty).
- [ ] BUG-008 (Medium): Fix `NotFound` auto-redirect (no `navigate` inside state updater).
- [ ] BUG-009 (Medium): Invalidate `roleCache` on sign-out / auth change in `useUserRole`.
- [ ] BUG-010 (Medium): Clear `FeedbackChat` timeouts on close/unmount.
- [ ] BUG-011 (Low): Stop swallowing feedback insert errors; consider storing an author/session id.
- [ ] BUG-012 (Low): Mount or delete the unused `SEO.tsx` component.
- [ ] BUG-013 (Low): Fix `isSupabaseError` code matching (`PGRST*`) and reduce false-positive redirects.
- [ ] BUG-014 (Low): Fix the 5 eslint errors (`any`, empty interfaces, `require()`).

---

## Organization & Architecture

- [ ] ORG-001 (High): Introduce a `src/services/*` data-access layer and remove duplicated inline Supabase calls.
- [ ] ORG-002 (High): Standardize admin editors on React Query (`useQuery`/`useMutation`/`invalidateQueries`).
- [ ] ORG-003 (Medium): Enable TypeScript strictness incrementally and re-enable `no-unused-vars`.
- [ ] ORG-004 (Medium): Replace hand-written row interfaces in admin editors with generated `Database` types.
- [ ] ORG-005 (Medium): Split oversized files (`sidebar.tsx`, `ProjectsEditor.tsx`, `PortfolioDataManager.tsx`, `SkillsEditor.tsx`, `MessagesViewer.tsx`, `ExperiencesEditor.tsx`).
- [ ] ORG-006 (Medium): Move upload/snapshot business logic out of UI components into hooks/services.
- [ ] ORG-007 (Low): Remove or wire up dead code (`SEO.tsx`, `useSiteImages`, `useSiteImage`, `useSiteContentValue`).
- [ ] ORG-008 (Low): Normalize hook file naming and remove duplicate `use-toast` module.
- [ ] ORG-009 (Low): Replace placeholder `src/data/*` content or drop the unused static fallback path.
- [ ] ORG-010 (Low): Add `[functions.*]` config, a CI pipeline (`tsc`/`eslint`/`build`), and tests.

---

## Supabase & Database

- [ ] DB-001 (Critical): Commit an idempotent baseline migration for the 9 missing tables (proposed SQL in report).
- [ ] DB-002 (High): Add admin DELETE policy on `feedback_messages`.
- [ ] DB-003 (High): Restrict `feedback_messages` SELECT to admins (currently public `USING (true)`).
- [ ] DB-004 (High): Enforce `contact_info.show_publicly` at the DB (public read policy) and in the client.
- [ ] DB-005 (High): Create/document storage buckets + least-privilege `storage.objects` policies.
- [ ] DB-006 (Medium): Add unique constraints (site_content section+key, page_sections.section_key, profiles singleton).
- [ ] DB-007 (Medium): Commit explicit public-read RLS policies for base content tables + `updated_at` triggers.
- [ ] DB-008 (Medium): Document first-admin bootstrap and ensure admin-write RLS on all admin tables.
- [ ] DB-009 (Low): Remove the duplicated hardcoded draft id; add PK default if not required.
- [ ] DB-010 (Low): Drop the dead `restore_portfolio_content` function/grant and regenerate types.
- [ ] DB-011 (Low): Add durable server-side contact-form throttling / captcha.
- [ ] DB-012 (Low): Regenerate/verify types vs remote schema; replace `TODO(me)` seed sentinels.

---

## UI / UX

- [ ] UX-001 (High): Use a shared confirmation dialog for all destructive deletes (Education/Courses/Languages currently none).
- [ ] UX-002 (Medium): Add consistent loading/empty/error states (Contact, PortfolioDataManager, hooks).
- [ ] UX-003 (Medium): Add inline success/error on the contact form and `maxLength` on inputs.
- [ ] UX-004 (Medium): Fix keyboard/a11y on clickable `div`s and icon-only controls (`SkillCard`, `ExperienceCard`, tag removal, filter trigger).
- [ ] UX-005 (Medium): Unify theming (theme tokens vs hardcoded hex; fix `FeedbackChat` light-mode contrast).
- [ ] UX-006 (Medium): Source the Hero name/title from `useProfile()` instead of static data.
- [ ] UX-007 (Low): Validate skill icon names with inline feedback (avoid silent `Code2` fallback).
- [ ] UX-008 (Low): Remove the 404 auto-redirect and use `READ_KEY` for the chat unread badge.
- [ ] UX-009 (Low): Make the 11 admin tabs responsive/discoverable on mobile.
- [ ] UX-010 (Low): Apply per-route SEO metadata (`SEO`/`useDocumentMeta`) and expand the sitemap.