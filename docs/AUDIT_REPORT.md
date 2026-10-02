# Taleex Portfolio — Full Technical Audit Report

**Project:** PF_Taleex (personal portfolio + admin CMS)
**Repo:** `https://github.com/taleex/PF_Taleex`
**Supabase project ref:** `ooefpodiqdupfpyqmaif`
**Audit date:** 2026-10-02
**Audit type:** Read-only technical audit. No application code, styles, or database schema were changed. Only files under `/docs` were written.

---

## 1. Executive Summary

The app is a React 18 + TypeScript + Vite single-page portfolio with an authenticated admin CMS backed by Supabase. The public site reads editable content from Supabase; the admin edits it. The codebase is functional and reasonably structured, but it has **no reproducible database schema in the repo**, a **broken contact-email path**, and **several RLS/privacy gaps** that are the highest-risk items.

### Health score by area

| Area | Score | Notes |
| --- | --- | --- |
| Bugs | 5 / 10 | Build/lint/type-check run, but several runtime/logic defects; contact email is effectively dead. |
| Organization & architecture | 6 / 10 | Clear folder layout, but no data-access layer, duplicated Supabase calls, large files, strict mode off, dead code. |
| Supabase & database | 4 / 10 | Base schema missing from migrations; RLS gaps (feedback privacy, admin delete); storage/edge functions untracked. |
| UI / UX | 6 / 10 | Good loading spinners and empty states in several places; inconsistent confirmations, silent fallbacks, a11y gaps. |

### Top 5 priorities

1. **DB-001 (Critical)** — Commit the base schema (profiles, projects, experiences, skills, skill_categories, contact_info, page_sections, site_content, site_images, user_roles, contact_submissions, feedback_messages) to `supabase/migrations/`. The repo cannot currently rebuild the database.
2. **BUG-001 (Critical)** — `send-contact-email` sends to a placeholder recipient (`your-email@example.com`); contact-form emails never reach the owner and the failure is swallowed client-side.
3. **DB-003 + DB-002 (High)** — `feedback_messages` is world-readable (`USING (true)`) and has no DELETE/UPDATE policy, so all visitor feedback is public and the admin delete button does nothing.
4. **BUG-003 + DB-004 (High)** — The public contact section ignores `contact_info.show_publicly`; phone numbers marked private are still rendered.
5. **ORG-001 + ORG-003 (High/Medium)** — Introduce a shared Supabase data-access layer and turn on TypeScript strictness; this underpins almost every other fix.

### Verification performed

- `npx tsc -p tsconfig.app.json --noEmit` → **exit 0** (but `strict`, `noImplicitAny`, `noUnusedLocals` are all off).
- `npx eslint .` → **exit 1**, **5 errors / 10 warnings** (see ORG-003, BUG-005, BUG-009, BUG-011, BUG-012).
- Static reading of all `src/**`, `supabase/**`, config files, and `public/**`.

---

## 2. Project Overview

### 2.1 Purpose

A personal portfolio and content-management app. Visitors browse projects/skills/experience and send contact messages or feedback; an authenticated admin edits all content through tabbed editors and can export/import a versioned JSON snapshot of the database.

### 2.2 Tech stack

- **Frontend:** React 18, TypeScript 5.5, Vite 7, Tailwind CSS 3, shadcn/ui (Radix UI), React Router 6, Lucide + react-icons.
- **Data/state:** `@tanstack/react-query` v5, `react-hook-form` + `zod` (contact/auth/snapshot validation), `sonner` + shadcn toast.
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, `supabase-js` v2.58). No realtime subscriptions found.
- **Other:** `@dnd-kit` (drag-reorder), `dompurify` (sanitizing bio/contact input), `date-fns`.

### 2.3 Folder structure (`src/`)

```
src/
├── components/          # Page sections + feature components
│   ├── admin/           # CMS editors (Profile, Projects, Skills, …)
│   │   └── profile/     # Profile sub-editors
│   ├── about/ contact/ experience/ hero/ home/ layout/ projects/ skills/
│   └── ui/              # shadcn/ui primitives + ProjectCard, LazyImage, spotlight-card
├── hooks/               # useAuth, useUserRole, useProfile, useProjects, useSkills,
│                        # useExperiences, useContactInfo, useSiteContent, usePageSections,
│                        # useSiteImages, useProjectFilters, useRateLimit, useContactForm,
│                        # useAuthForm, useDarkMode, useScroll*, use-mobile, use-toast
├── data/                # Static fallback data (projects, skills, experience, profile, contact)
├── lib/                 # utils (cn/throttle/debounce), supabase-error, error-utils, auth-validation
├── integrations/supabase/  # client.ts + generated types.ts
├── pages/               # Index, ProjectsPage, Auth, Admin, NotFound, ServiceUnavailable
├── types/               # project.ts, portfolio-content.ts, portfolio-sections.ts
├── config/              # cloud.ts (CLOUD_ENABLED)
└── styles/              # base.css, components.css, themes.css, animations.css
```

### 2.4 Main routes / pages

| Route | Component | Protection |
| --- | --- | --- |
| `/` | `pages/Index.tsx` → `HomeContent` (Hero, About, Skills, Experience, Projects, Contact, Footer) | Public |
| `/projects` | `pages/ProjectsPage.tsx` | Public |
| `/auth` | `pages/Auth.tsx` (login form) | Public |
| `/admin/*` | `pages/Admin.tsx` (tabbed editors) | `ProtectedRoute` (auth + admin role, client-side) |
| `/service-unavailable` | `pages/ServiceUnavailable.tsx` | Public |
| `*` | `pages/NotFound.tsx` | Public (auto-redirects home after 5s) |

`App.tsx` wraps everything in `QueryClientProvider`, `TooltipProvider`, toasts, `BrowserRouter`, and `SupabaseErrorHandler`. `AppSidebar`, `Header`, `ScrollToTop`, `ScrollProgress`, `BackToTop`, and lazy `FeedbackChat` are hidden on `/admin` and `/auth`.

### 2.5 Main data flows

- **Read (public):** hooks → `supabase.from(<table>).select("*")` → mapped to view models → React Query cache (`staleTime` 5 min). `CLOUD_ENABLED` (`src/config/cloud.ts`, hardcoded `true`) toggles static fallback data from `src/data/*`.
- **Write (admin):** each `components/admin/*Editor.tsx` calls Supabase directly (`insert`/`update`/`upsert`/`delete`) inside `useState`+`useEffect`, then re-fetches. Only the `Education/Courses/Languages` editors invalidate React Query keys; the rest re-fetch locally.
- **Contact:** `useContactForm` sanitizes (DOMPurify) → Zod validate → `insert` into `contact_submissions` → `supabase.functions.invoke('send-contact-email')` → toast.
- **Feedback:** `FeedbackChat` inserts messages into `feedback_messages` and shows a canned bot conversation (not read back from DB).
- **Backup/restore:** `PortfolioDataManager` exports all 12 tables to JSON (Zod `portfolioSnapshotSchema`), saves a draft via RPC `save_portfolio_draft`, and publishes via `publish_portfolio_draft`.

### 2.6 Every place Supabase is used

- **Client:** `src/integrations/supabase/client.ts` (env-validated `createClient<Database>`, `persistSession`, `autoRefreshToken`, `localStorage`).
- **Auth:** `useAuth.ts` (`onAuthStateChange`, `getSession`, `signOut`), `useAuthForm.ts` (`signInWithPassword`), `useUserRole.ts` (reads `user_roles`).
- **Tables queried:** `profiles`, `projects`, `experiences`, `skills`, `skill_categories`, `contact_info`, `contact_submissions`, `feedback_messages`, `page_sections`, `site_content`, `site_images`, `education`, `courses`, `languages`, `user_roles`, `portfolio_content_drafts`.
- **RPCs:** `save_portfolio_draft`, `publish_portfolio_draft` (`PortfolioDataManager.tsx`).
- **Storage buckets:** `project-images` (`ProjectsEditor`), `documents` (`ProfileCVUpload`), `skill-icons` (`SkillsEditor`).
- **Edge Functions invoked:** `send-contact-email` (`useContactForm`), `send-error-report` (`lib/supabase-error.ts`).
- **Realtime:** none found.
- **Generated types:** `src/integrations/supabase/types.ts` (743 lines).

---
## 3. Findings

Findings are grouped by area. Each uses the standard block: ID, Severity, Location, Problem, Impact, Suggested fix, Effort (S/M/L), Status. Items flagged **Needs verification** explain why. All `Status` values are `Open` (no code was changed in this audit).

### 3.A Bugs

#### BUG-001
- **ID:** BUG-001
- **Severity:** Critical
- **Location:** `supabase/functions/send-contact-email/index.ts:134` (recipient), `index.ts:133` (from), `src/hooks/useContactForm.ts:148-154`
- **Problem:** The edge function sends the notification to the literal placeholder `to: ["your-email@example.com"]` and `from: "Portfolio Contact <onboarding@resend.dev>"`. With Resend, `onboarding@resend.dev` can only deliver to the account owner's address, so mail to `your-email@example.com` cannot succeed. On the client, `useContactForm` ignores `emailError` (comment at line 153) and always shows "Message sent successfully!".
- **Impact:** The owner never receives contact-form emails. Visitors are told the message was sent even though only the DB row was created. Silent, user-visible loss of leads.
- **Suggested fix:** Move the recipient into a secret and use a verified sender. In `send-contact-email/index.ts`, replace the hardcoded `to` with `Deno.env.get("CONTACT_TO_EMAIL")` and `from` with a verified domain address from `Deno.env.get("CONTACT_FROM_EMAIL")`; throw if unset. In `useContactForm.ts`, surface a non-blocking warning when `emailError` is set (message saved, email not delivered). Set the secrets in the Supabase dashboard.
- **Effort:** S
- **Status:** Open

#### BUG-002
- **ID:** BUG-002
- **Severity:** High
- **Location:** `src/hooks/useProfile.ts:30-35`, `src/components/Header.tsx:23-32`
- **Problem:** Both query `profiles` with `select("*").maybeSingle()` and no filter or `order`. `maybeSingle()` errors (`PGRST116`) when the table has more than one row. The public `useProfile` has `placeholderData: userProfile` so the error is masked, but the Header query has no `onError`/fallback.
- **Impact:** If an extra `profiles` row exists (possible because there is no single-row constraint — see DB-006), profile data silently falls back to static placeholders and the Header CV button disappears without explanation.
- **Suggested fix:** Give `profiles` a single-row guarantee (DB-006) or filter by a stable key (e.g. lowest `created_at` / `user_id` of the known admin), and add an `order("created_at").limit(1)` guard. Add an `onError` handler in `Header.tsx`.
- **Effort:** S
- **Status:** Open

#### BUG-003
- **ID:** BUG-003
- **Severity:** High
- **Location:** `src/hooks/useContactInfo.ts:24-55`, `src/components/contact/ContactInfo.tsx:45-53`
- **Problem:** `useContactInfo` maps every `contact_info` row into `social`/`info` without checking `show_publicly`. `ContactInfo.tsx` always renders the phone tile. The DB default for new contact rows is now private (`20260929140000_private_contact_default.sql`), and phone rows were forced private, but the public UI ignores the flag.
- **Impact:** Data the admin marked private (phone) is still displayed publicly.
- **Suggested fix:** Filter `rows.filter(item => item.show_publicly !== false)` before mapping in `useContactInfo.ts`, and conditionally render the phone tile in `ContactInfo.tsx` only when a public phone value exists.
- **Effort:** S
- **Status:** Open

#### BUG-004
- **ID:** BUG-004
- **Severity:** Medium
- **Location:** `src/hooks/useProjectFilters.ts:21-27`, `:36-37`, `:45-46`
- **Problem:** The URL-skill effect uses `searchParams` but omits `activeSkills` from its dependency array (eslint `react-hooks/exhaustive-deps` warning at line 27). Separately, `toggleSkill`/`clearFilters` mutate the `searchParams` object in place with `searchParams.delete(...)` before calling `setSearchParams(searchParams)`.
- **Impact:** Effect can re-run against a stale `activeSkills` and re-apply the URL skill after the user cleared it; in-place mutation of the URLSearchParams object is a React Router anti-pattern that can cause missed navigations/renders.
- **Suggested fix:** Add `activeSkills` to the effect deps (or read the latest values via a ref). Build a new `URLSearchParams(searchParams)` before mutating and pass the clone to `setSearchParams`.
- **Effort:** S
- **Status:** Open

#### BUG-005
- **ID:** BUG-005
- **Severity:** Medium
- **Location:** `src/components/admin/ProfileEditor.tsx:112`
- **Problem:** `handleSave` writes `experience_years: null` unconditionally, even though the form/state tracks `experience_years`.
- **Impact:** Any numeric years-of-experience value is erased on every profile save, and `useProfile`'s fallback `${row.experience_years}+ Years` never resolves from data.
- **Suggested fix:** Persist the actual `profile.experience_years` value (or remove the field from the interface if intentionally deprecated).
- **Effort:** S
- **Status:** Open

#### BUG-006
- **ID:** BUG-006
- **Severity:** Medium
- **Location:** `src/components/StructuredData.tsx:55-64`, `src/hooks/useExperiences.ts:29`
- **Problem:** The JSON-LD `workExperienceSchemas` calls `exp.period.split(' - ')[0]`/`[1]` assuming an exact ` - ` delimiter, and `exp.technologies.join(', ')`. `useExperiences` always sets `technologies: []` (line 29), so `skills` is always an empty string, and a period in another format yields `undefined` dates.
- **Impact:** Malformed/empty structured data is published to search engines; may trigger structured-data warnings and reduces rich-result quality.
- **Suggested fix:** Parse `period` defensively (regex for two 4-digit years) and omit `startDate`/`endDate`/`skills` fields when unavailable; or add a technologies relation to `experiences` if the data is wanted.
- **Effort:** S
- **Status:** Open

#### BUG-007
- **ID:** BUG-007
- **Severity:** Medium
- **Location:** `src/components/Header.tsx:23-32`
- **Problem:** The profile-CV `useQuery` has no `throwOnError`/`onError` and no error UI. Any Supabase error resolves to `data === undefined`, which is indistinguishable from "no CV".
- **Impact:** During an outage or RLS misconfiguration, the Download CV button silently disappears instead of showing an error, and users cannot tell data is missing.
- **Suggested fix:** Add an error branch/toast and distinguish loading vs empty vs error in the Header render.
- **Effort:** S
- **Status:** Open

#### BUG-008
- **ID:** BUG-008
- **Severity:** Medium
- **Location:** `src/pages/NotFound.tsx:11-25`
- **Problem:** `navigate('/')` is invoked inside the functional updater of `setCountdown` within a `setInterval`. Calling a router navigation from inside a state updater is a React anti-pattern (updaters must be pure) and can fire twice under React 18 StrictMode in development.
- **Impact:** Unreliable auto-redirect and potential double navigation; a surprising forced redirect for users who wanted to stay on the 404 page.
- **Suggested fix:** Compute the countdown in an effect and navigate in a separate effect when `countdown === 0`; keep the manual buttons. Consider not auto-redirecting at all.
- **Effort:** S
- **Status:** Open

#### BUG-009
- **ID:** BUG-009
- **Severity:** Medium
- **Location:** `src/hooks/useUserRole.ts:14` (global `roleCache`), `:42-48`, `src/hooks/useAuth.ts:30-32`
- **Problem:** `roleCache` is a module-level `Map` keyed by `user.id` and is never cleared. `signOut()` in `useAuth` does not clear it. Cache TTL is 5 minutes.
- **Impact:** Stale admin/non-admin decisions can persist across sign-out/sign-in for the same user id within the TTL; role changes made server-side are not reflected until the cache expires.
- **Suggested fix:** Clear `roleCache` on `signOut`/`onAuthStateChange` (or invalidate the entry), and expose a `refreshRole()`.
- **Effort:** S
- **Status:** Open

#### BUG-010
- **ID:** BUG-010
- **Severity:** Medium
- **Location:** `src/components/FeedbackChat.tsx:36-41`, `:59-80`, `:108-148`
- **Problem:** Greeting/bot sequences use nested `setTimeout`s and the "animate after 500ms" timer in the mount effect; none are cleared on unmount or on `handleClose` (`:150-157`). Late timeouts still call `setMessages`/`setIsTyping` after the component is closed/unmounted.
- **Impact:** "Can't perform a React state update on an unmounted component" warnings, reopening the chat can replay overlapping bot timers, and `setConversationStage` can be wrong.
- **Suggested fix:** Track timeout ids in a ref and clear them in `handleClose` and in an effect cleanup; or drive the sequence with a reducer + a single cancellable timer.
- **Effort:** M
- **Status:** Open

#### BUG-011
- **ID:** BUG-011
- **Severity:** Low
- **Location:** `src/components/FeedbackChat.tsx:97-105`, `:116-143`
- **Problem:** Inserts into `feedback_messages` are wrapped in `try/catch {}` that swallow all errors, and the insert payload stores only `{ message, type }` with no user/author id (see schema DB-003).
- **Impact:** Feedback can be silently lost with no telemetry; messages are anonymized so they cannot be attributed or replied to.
- **Suggested fix:** Log/notify on failure (e.g. `notifySupabaseError`) and include a stable client/session identifier if feedback should be attributable.
- **Effort:** S
- **Status:** Open

#### BUG-012
- **ID:** BUG-012
- **Severity:** Low
- **Location:** `src/components/SEO.tsx` (whole file)
- **Problem:** `SEO` implements runtime title/description/keywords/OG/Twitter/canonical updates but is never rendered anywhere (`grep "<SEO"` returns no usages). Only the static `index.html` tags and `StructuredData` apply.
- **Impact:** Per-route SEO metadata is never applied; link previews and search snippets use static defaults for every page.
- **Suggested fix:** Mount `<SEO />` in `Index.tsx` and `ProjectsPage.tsx` (with per-page props), or delete the component if SEO is intentionally static.
- **Effort:** S
- **Status:** Open

#### BUG-013
- **ID:** BUG-013
- **Severity:** Low
- **Location:** `src/lib/supabase-error.ts:66-74`, `src/App.tsx:44-54`
- **Problem:** Outage detection checks `code === "PGRST"`, but real PostgREST errors use codes such as `PGRST116`, `PGRST202`, `PGRST205`. It also matches generic substrings in `message` ("database", "supabase") that can be false positives.
- **Impact:** The global `SupabaseErrorHandler` may both miss genuine outages and over-trigger redirects to `/service-unavailable` on unrelated messages ("database" appears in normal validation text).
- **Suggested fix:** Match `code?.startsWith("PGRST")` and specific Postgres codes (`42P01`, `PGRST116`), and gate redirects on connection-type failures only.
- **Effort:** S
- **Status:** Open

#### BUG-014
- **ID:** BUG-014
- **Severity:** Low
- **Location:** `src/components/ui/spotlight-card.tsx:96`, `src/components/ui/command.tsx:24`, `src/components/ui/textarea.tsx:5`, `tailwind.config.ts:110`, `supabase/functions/send-contact-email/index.ts:164`
- **Problem:** `npx eslint .` fails with 5 errors: `any` at `spotlight-card.tsx:96` and `send-contact-email/index.ts:164`, empty interfaces at `command.tsx:24` and `textarea.tsx:5`, and `require()` in `tailwind.config.ts:110`. There are also 10 `react-refresh`/`exhaustive-deps` warnings.
- **Impact:** `npm run lint` fails, which blocks using lint as a gate in CI/pre-commit.
- **Suggested fix:** Replace `Record<string, any>` with a typed record, use `type X = Y` instead of empty interfaces, import `tailwindcss-animate` via ESM, and type the edge-function catch as `unknown`.
- **Effort:** S
- **Status:** Open

### 3.B Organization & Architecture

#### ORG-001
- **ID:** ORG-001
- **Severity:** High
- **Location:** `src/hooks/*` (useProfile, useProjects, useSkills, useExperiences, useContactInfo, useSiteContent, usePageSections, useSiteImages), `src/components/admin/*Editor.tsx`, `src/components/Header.tsx`, `src/components/FeedbackChat.tsx`, `src/lib/supabase-error.ts`
- **Problem:** There is no data-access layer. At least 15 files import the Supabase client and build ad-hoc queries inline with duplicated row-mapping and error-handling logic.
- **Impact:** Every schema change requires edits scattered across the codebase; error handling, loading, and typing are inconsistent; hard to test.
- **Suggested fix:** Introduce `src/services/*.ts` (e.g. `profileService`, `projectsService`, `contactService`) that own all `supabase.from(...)` calls and return typed models; have hooks/query functions and admin editors consume the services.
- **Effort:** L
- **Status:** Open

#### ORG-002
- **ID:** ORG-002
- **Severity:** High
- **Location:** `src/components/admin/ProjectsEditor.tsx`, `SkillsEditor.tsx`, `ExperiencesEditor.tsx`, `ContactEditor.tsx`, `PageSectionsEditor.tsx`, `ProfileEditor.tsx`, `MessagesViewer.tsx` vs `src/components/admin/EducationEditor.tsx`, `CoursesEditor.tsx`, `LanguagesEditor.tsx`
- **Problem:** Two different data patterns coexist. Most admin editors fetch into local `useState` via `useEffect` and re-fetch after each mutation; Education/Courses/Languages use `useQueryClient().invalidateQueries`. React Query is only used on the public side.
- **Impact:** Inconsistent caching, redundant refetches, stale admin views, and more code per editor; hard for contributors to know the "blessed" pattern.
- **Suggested fix:** Standardize on React Query (`useQuery` + `useMutation` + `invalidateQueries`) for all admin editors.
- **Effort:** L
- **Status:** Open

#### ORG-003
- **ID:** ORG-003
- **Severity:** Medium
- **Location:** `tsconfig.app.json:18-22`, `eslint.config.js:26`
- **Problem:** `strict: false`, `noImplicitAny: false`, `noUnusedLocals: false`, `noUnusedParameters: false`, and eslint `@typescript-eslint/no-unused-vars: "off"`.
- **Impact:** Null/undefined and `any` defects are not caught at compile time (e.g. the `any` casts around Supabase rows); unused variables/imports accumulate unnoticed.
- **Suggested fix:** Incrementally enable `noImplicitAny` and `strictNullChecks`, then `strict`, and turn `no-unused-vars` back on with `argsIgnorePattern: "^_"`.
- **Effort:** L
- **Status:** Open

#### ORG-004
- **ID:** ORG-004
- **Severity:** Medium
- **Location:** `src/components/admin/ProjectsEditor.tsx:54-68`, `src/components/admin/SkillsEditor.tsx:35-49`, `src/components/admin/ExperiencesEditor.tsx:29-37`, `src/components/admin/MessagesViewer.tsx:45-60`, `src/components/admin/ContactEditor.tsx:13-23`
- **Problem:** Each editor re-declares hand-written row interfaces instead of importing the generated `Database` row types from `src/integrations/supabase/types.ts` (used elsewhere, e.g. `types/portfolio-sections.ts`).
- **Impact:** Types drift from the real schema; renames/added columns silently break mapping at runtime.
- **Suggested fix:** Replace local interfaces with `Database["public"]["Tables"]["<table>"]["Row"]` (or shared view-model types) and delete duplicates.
- **Effort:** M
- **Status:** Open

#### ORG-005
- **ID:** ORG-005
- **Severity:** Medium
- **Location:** `src/components/ui/sidebar.tsx` (761), `src/components/admin/ProjectsEditor.tsx` (695), `src/components/admin/PortfolioDataManager.tsx` (556), `src/components/admin/SkillsEditor.tsx` (547), `src/components/admin/MessagesViewer.tsx` (464), `src/components/admin/ExperiencesEditor.tsx` (385)
- **Problem:** Several files exceed ~350–760 lines and mix fetching, drag-and-drop, upload, validation, and rendering.
- **Impact:** High cognitive load, difficult reviews, more merge conflicts, harder to test in isolation.
- **Suggested fix:** Split admin editors into a container + presentational card + a form sub-component; extract upload/drag logic into hooks.
- **Effort:** L
- **Status:** Open

#### ORG-006
- **ID:** ORG-006
- **Severity:** Medium
- **Location:** `src/components/admin/ProjectsEditor.tsx:107-164` (upload + validation + DB), `src/components/admin/PortfolioDataManager.tsx:138-387` (file parse, Zod, RPC, direct upsert)
- **Problem:** Business logic (file validation, storage upload, snapshot application) lives inside UI components rather than hooks/services.
- **Impact:** Duplicated/uneven validation (e.g. ProjectsEditor validates image type/size but ProfileCVUpload does not), and logic is not reusable or unit-testable.
- **Suggested fix:** Move upload and snapshot logic into `use*` hooks or services with their own validation.
- **Effort:** M
- **Status:** Open

#### ORG-007
- **ID:** ORG-007
- **Severity:** Low
- **Location:** `src/components/SEO.tsx`, `src/hooks/useSiteImages.ts`, `src/hooks/useSiteContent.ts:38-45` (`useSiteContentValue`), `src/hooks/useSiteImages.ts:30-49` (`useSiteImage`)
- **Problem:** Dead code: `SEO.tsx` is never mounted (BUG-012); `useSiteImages`, `useSiteImage`, and `useSiteContentValue` have no importers; `site_images` is otherwise unused by the UI.
- **Impact:** Wasted maintenance surface and misleading signals about what the app actually uses.
- **Suggested fix:** Either wire these up or delete them; if `site_images` is meant to be used, add the consuming component.
- **Effort:** S
- **Status:** Open

#### ORG-008
- **ID:** ORG-008
- **Severity:** Low
- **Location:** `src/hooks/use-mobile.tsx`, `src/hooks/use-toast.ts` vs `src/hooks/useAuth.ts`, `src/hooks/useProfile.ts`; `src/components/ui/use-toast.ts` vs `src/hooks/use-toast.ts`
- **Problem:** Hook filenames mix kebab-case and camelCase, and `use-toast` exists in both `hooks/` and `components/ui/`.
- **Impact:** Minor inconsistency; duplicated toast module risks divergence.
- **Suggested fix:** Adopt one naming convention and delete the duplicate toast module.
- **Effort:** S
- **Status:** Open

#### ORG-009
- **ID:** ORG-009
- **Severity:** Low
- **Location:** `src/data/profile.ts`, `src/data/contact.ts`, `src/data/projects.ts`, `src/data/experience.ts`, `src/data/skills.ts`
- **Problem:** Static modules ship generic placeholder identity (`your.email@example.com`, "San Francisco, CA", fake projects/experience, "5 years") and are used as fallbacks/`placeholderData` while `CLOUD_ENABLED` is hardcoded `true`.
- **Impact:** If a query fails, placeholder content that looks real can be shown to visitors; also dead weight.
- **Suggested fix:** Replace placeholders with clearly-labelled empty/neutral fallbacks, or remove the static fallback path now that `CLOUD_ENABLED` is always true.
- **Effort:** M
- **Status:** Open

#### ORG-010
- **ID:** ORG-010
- **Severity:** Low
- **Location:** `supabase/config.toml`, repository root
- **Problem:** `config.toml` contains only `project_id` (no `[functions.*]`, no storage config). There are no tests and no CI workflow (`.github/workflows` absent).
- **Impact:** Edge-function settings (e.g. `verify_jwt`) are implicit; regressions are not caught automatically; `tsc`/`eslint` are not enforced.
- **Suggested fix:** Add `[functions.send-contact-email]`/`[functions.send-error-report]` entries, add a minimal CI running `tsc`, `eslint`, and `vite build`, and add tests when the data layer exists.
- **Effort:** M
- **Status:** Open

### 3.C Supabase & Database

> Scope note: every table/column/view/function/bucket referenced in code was compared against `supabase/migrations/` and `supabase/manual/portfolio_content_backend.sql`. Code references: tables `profiles, projects, experiences, skills, skill_categories, contact_info, contact_submissions, feedback_messages, page_sections, site_content, site_images, education, courses, languages, user_roles, portfolio_content_drafts`; functions `has_role, save_portfolio_draft, publish_portfolio_draft`; buckets `project-images, documents, skill-icons`. Migrations only create `feedback_messages`, `contact_submissions`, `user_roles`, `education`, `courses`, `languages`, `portfolio_content_drafts` (+ columns on `profiles`/`contact_info`/`projects`) and the three functions. The **9 remaining tables have no `CREATE TABLE` anywhere in the repo.**

#### DB-001
- **ID:** DB-001
- **Severity:** Critical
- **Location:** `supabase/migrations/` (all files), `supabase/manual/portfolio_content_backend.sql`
- **Problem:** `profiles`, `projects`, `experiences`, `skills`, `skill_categories`, `contact_info`, `page_sections`, `site_content`, `site_images` are referenced throughout the app and by later migrations, but are **never created in the repo**. Migration `20251003183633` even does `DROP POLICY IF EXISTS "Allow authenticated users to manage profiles"` on a table the repo never created, so it fails on a fresh database. `src/integrations/supabase/types.ts` proves these tables/columns exist remotely.
- **Impact:** The database cannot be rebuilt from the repository. New environments, disaster recovery, and audits are impossible without manual dashboard work; `supabase db push` on a clean project errors.
- **Suggested fix:** Add an idempotent baseline migration creating the 9 missing tables (columns per `types.ts`), enable RLS, and add public-read + admin-manage policies. Proposed SQL (report only — do NOT run):

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL DEFAULT '', title text NOT NULL DEFAULT '',
  bio text, avatar_url text, location text, email text, interests text,
  experience_years integer, experience_label text,
  open_to_remote boolean NOT NULL DEFAULT false,
  timezone text, availability text, tags text[], cv_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Professional'
    CHECK (category IN ('Personal','Professional','Open Source','Course')),
  description text NOT NULL DEFAULT '',
  image_url text, tags text[], github_url text, demo_url text,
  featured boolean DEFAULT false, order_index integer,
  problem text, highlights text[], what_i_would_improve text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL, position text NOT NULL, period text NOT NULL,
  description text, employment_type text, location text, highlights text[],
  order_index integer,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, icon text, order_index integer,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, icon text,
  category_id uuid REFERENCES public.skill_categories(id) ON DELETE CASCADE,
  level integer, order_index integer, svg_url text, svg_url_dark text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.contact_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  info_key text NOT NULL, label text NOT NULL, value text NOT NULL,
  type text, link text, icon text, icon_name text, order_index integer,
  show_publicly boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL, title text, subtitle text, content text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL, section text NOT NULL, value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.site_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_key text NOT NULL, image_url text NOT NULL,
  alt_text text, description text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

(RLS/policies/indexes for these tables: see DB-006/DB-007.)
- **Effort:** M
- **Status:** Open

#### DB-002
- **ID:** DB-002
- **Severity:** High
- **Location:** `supabase/migrations/20251002114321_bbb5f312-c184-4d54-a6d2-535fd50037dc.sql:9-22`, `src/components/admin/MessagesViewer.tsx:126-147`
- **Problem:** `feedback_messages` has RLS enabled with only `INSERT` (`WITH CHECK (true)`) and `SELECT` (`USING (true)`) policies. There is no `DELETE` (or `UPDATE`) policy, yet the admin UI calls `.delete()` at `MessagesViewer.tsx:128-131`.
- **Impact:** Admin feedback deletion silently affects 0 rows (PostgREST returns no error for a no-op delete), so the UI shows "Feedback deleted successfully" while the row remains.
- **Suggested fix:**

```sql
CREATE POLICY "Admins can delete feedback messages"
ON public.feedback_messages FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```
- **Effort:** S
- **Status:** Open

#### DB-003
- **ID:** DB-003
- **Severity:** High
- **Location:** `supabase/migrations/20251002114321_bbb5f312-c184-4d54-a6d2-535fd50037dc.sql:18-22`
- **Problem:** The policy `"Public read access to feedback messages"` uses `FOR SELECT USING (true)`, and the table has no `user_id`/author column. Any visitor (anon key) can read every feedback message ever submitted.
- **Impact:** Privacy leak: user feedback submitted in the chat widget is world-readable; combined with DB-002, rows can never be removed by admins.
- **Suggested fix:** Restrict reads to admins; if visitor history is needed, add a session column and filter on it.

```sql
DROP POLICY IF EXISTS "Public read access to feedback messages" ON public.feedback_messages;
ALTER TABLE public.feedback_messages ADD COLUMN IF NOT EXISTS session_id uuid;
CREATE POLICY "Admins can read feedback messages"
ON public.feedback_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```
- **Effort:** S
- **Status:** Open

#### DB-004
- **ID:** DB-004
- **Severity:** High
- **Location:** `supabase/migrations/20260929100000_portfolio_content_v2.sql:7-8`, `20260929140000_private_contact_default.sql`, `src/hooks/useContactInfo.ts`, `src/components/contact/ContactInfo.tsx`
- **Problem:** `contact_info.show_publicly` exists (default now `false`) and phone rows were forced private, but nothing enforces it on read: the public hook selects `*` and the UI never checks the flag (BUG-003). If the only anon SELECT policy on `contact_info` is a plain `USING(true)`, private values are exposed both by the API and the UI.
- **Impact:** Unintended public exposure of private contact details (e.g. phone). The privacy migration gives a false sense of safety.
- **Suggested fix:** Enforce at both layers. DB (defense in depth):

```sql
CREATE POLICY "Public can read public contact info"
ON public.contact_info FOR SELECT TO anon, authenticated
USING (show_publicly = true);
```
Plus the client-side filter in `useContactInfo.ts` (see BUG-003).
- **Effort:** S
- **Status:** Open

#### DB-005
- **ID:** DB-005
- **Severity:** High
- **Location:** `src/components/admin/ProjectsEditor.tsx:139-147` (`project-images`), `src/components/admin/profile/ProfileCVUpload.tsx:30-38` (`documents`), `src/components/admin/SkillsEditor.tsx:358-366` (`skill-icons`)
- **Problem:** Three storage buckets are used, but none are created or configured in the repo (buckets are dashboard-created and not in migrations), and there are no `storage.objects` policies tracked. All three use `getPublicUrl` (public buckets). No server-side MIME/size restriction is present.
- **Impact:** Buckets/policies cannot be reproduced; if a bucket is misconfigured as public-write, authenticated attackers could upload arbitrary files. `ProfileCVUpload` performs no client-side type/size validation at all.
- **Suggested fix:** Document/create buckets and add least-privilege storage policies. Proposed SQL (report only):

```sql
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true),
       ('documents', 'documents', true),
       ('skill-icons', 'skill-icons', true)
on conflict (id) do nothing;

create policy "Public read media" on storage.objects for select
  using (bucket_id in ('project-images','documents','skill-icons'));
create policy "Admins can write media" on storage.objects for all
  to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
```
Also add file type/size validation to `ProfileCVUpload` (see BUG-014/ORG-006).
- **Effort:** M
- **Status:** Open

#### DB-006
- **ID:** DB-006
- **Severity:** Medium
- **Location:** `src/integrations/supabase/types.ts` (no unique constraints implied), `src/hooks/useProfile.ts` (`maybeSingle()`), `src/hooks/useSiteContent.ts`, `src/hooks/usePageSections.ts` (`maybeSingle`)
- **Problem:** There are no committed unique constraints to back the app's singleton assumptions: `profiles` is queried with `maybeSingle()` (expects ≤1 row); `site_content` is read into a `Record<key,value>` (duplicate `key`/`section` silently overwrite); `page_sections` is queried by `section_key` with `maybeSingle()`.
- **Impact:** A duplicate row makes `maybeSingle()` throw (`PGRST116`) and silently breaks the page; duplicate content keys produce nondeterministic values. (Needs verification: the remote DB may already have these constraints, but they are **not in the repo**.)
- **Suggested fix:**

```sql
CREATE UNIQUE INDEX IF NOT EXISTS site_content_section_key_uidx
  ON public.site_content (section, key);
CREATE UNIQUE INDEX IF NOT EXISTS page_sections_section_key_uidx
  ON public.page_sections (section_key);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_singleton_uidx
  ON public.profiles ((true));
```
- **Effort:** S
- **Status:** Open

#### DB-007
- **ID:** DB-007
- **Severity:** Medium
- **Location:** All 9 base tables (DB-001), `supabase/migrations/20251003183633_...sql:44-115`
- **Problem:** The only RLS policies committed for the base tables are **admin-manage** policies (created by dropping `"Allow authenticated users to manage …"` and adding `has_role` policies). The public read path the app relies on (anon `select` on `profiles/projects/experiences/skills/skill_categories/contact_info/page_sections/site_content/site_images`) is not present in any migration. (Needs verification: these public policies presumably exist in the remote DB from manual setup.) Additionally, `updated_at` columns exist but no trigger keeps them fresh.
- **Impact:** Policies are untracked and inconsistent; a fresh deploy would have RLS on with only admin policies, so the public site would show nothing. `updated_at` is only correct where the app sets it manually.
- **Suggested fix:** Commit explicit public-read policies and a shared `updated_at` trigger. Example:

```sql
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects','experiences','skill_categories','skills',
    'page_sections','site_content','site_images'] LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)',
      'Public can read ' || t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = timezone('utc', now()); RETURN NEW; END $$ LANGUAGE plpgsql;
```
(Apply `CREATE TRIGGER ... BEFORE UPDATE ... EXECUTE FUNCTION public.set_updated_at()` per table.)
- **Effort:** M
- **Status:** Open

#### DB-008
- **ID:** DB-008
- **Severity:** Medium
- **Location:** `supabase/migrations/20251003183633_...sql:1-42`, `src/components/ProtectedRoute.tsx`, `src/hooks/useUserRole.ts`
- **Problem:** Admin authorization is enforced only in the UI (`ProtectedRoute`/`useUserRole`) plus whatever RLS exists server-side. `user_roles` has no seed and there is no admin UI to grant the first admin, so bootstrapping requires a manual insert. The client role check is inherently bypassable.
- **Impact:** If table RLS is missing/incorrect on any table, a logged-in non-admin could read/write; conversely a new deployment has no admin at all.
- **Suggested fix:** Document the bootstrap (`insert into public.user_roles (user_id, role) values ('<uid>','admin');`) and ensure every admin-editable table has `has_role(auth.uid(),'admin')` write policies in a committed migration. Never rely on the client check for security.
- **Effort:** S
- **Status:** Open

#### DB-009
- **ID:** DB-009
- **Severity:** Low
- **Location:** `supabase/migrations/20260929130000_portfolio_snapshot_v2.sql:2-9,43,97` and `src/components/admin/PortfolioDataManager.tsx:31`
- **Problem:** The draft id `c6938771-507d-44b5-b69d-9e0b39e42974` is duplicated as a hardcoded constant in both the SQL functions and the client (`CURRENT_DRAFT_ID`), and the table PK has no default.
- **Impact:** Changing the id requires editing multiple places; risk of drift if one is changed and not the other.
- **Suggested fix:** Centralize (e.g. a single-row draft or a settings row) or at least document the shared constant; add `DEFAULT gen_random_uuid()` if the fixed id is not required.
- **Effort:** S
- **Status:** Open

#### DB-010
- **ID:** DB-010
- **Severity:** Low
- **Location:** `supabase/migrations/20260929000000_restore_portfolio_content.sql`, `src/integrations/supabase/types.ts:589-607`
- **Problem:** `restore_portfolio_content(jsonb)` is defined but always raises "Version 1 snapshot restore is disabled"; it is granted to `authenticated` but never called by the app. It is also absent from the generated `Functions` type map.
- **Impact:** Dead/inconsistent API surface; grants a function no one uses.
- **Suggested fix:** Drop the function (or the grant) if v1 restore is permanently retired, and regenerate types.
- **Effort:** S
- **Status:** Open

#### DB-011
- **ID:** DB-011
- **Severity:** Low
- **Location:** `supabase/migrations/20251002114321_...sql:38-42`, `supabase/functions/send-contact-email/index.ts:18-76`, `src/hooks/useRateLimit.ts`
- **Problem:** `contact_submissions` allows public `INSERT` with `WITH CHECK (true)` (unavoidable for a public form). Spam protection is only client-side (`useRateLimit` uses `sessionStorage`, trivially bypassed) plus an in-memory `Map` inside the edge function (resets on cold start and is per-instance, so ineffective in serverless).
- **Impact:** The contact table can be spammed; the edge rate limit gives a false sense of protection.
- **Suggested fix:** Add server-side throttling with durable storage (e.g. a Postgres table + IP/time check, or a captcha), and/or Supabase Auth/Captcha on the form.
- **Effort:** M
- **Status:** Open

#### DB-012
- **ID:** DB-012
- **Severity:** Low
- **Location:** `src/integrations/supabase/types.ts`; `supabase/migrations/20260929110000_portfolio_sections_seed.sql:44`, `:28-29`
- **Problem:** Generated types appear consistent with the 2026 migrations, but there is no check that they match the *remote base schema* (the 9 tables of DB-001). Seed data ships sentinel placeholders (`level = 'TODO(me)'`, `period`/`certificate_url` = `'TODO(me): …'`).
- **Impact:** Types can silently drift from production; placeholder text can surface publicly. **Needs verification:** only `supabase gen types typescript --linked` against the live project confirms type/schema sync (not run in this audit).
- **Suggested fix:** Regenerate types from the linked project after adding the DB-001 baseline migration, add a CI check that regenerates and diffs, and replace `TODO(me)` seed values with real or empty values.
- **Effort:** M
- **Status:** Open

### 3.D UI / UX

#### UX-001
- **ID:** UX-001
- **Severity:** High
- **Location:** `src/components/admin/ProjectsEditor.tsx:590`, `src/components/admin/SkillsEditor.tsx` (delete), `src/components/admin/ExperiencesEditor.tsx:281`, `src/components/admin/EducationEditor.tsx` (`remove`), `src/components/admin/CoursesEditor.tsx:94-106`, `src/components/admin/LanguagesEditor.tsx:105-117`, `src/components/admin/MessagesViewer.tsx:396-415`
- **Problem:** Destructive-action confirmation is inconsistent. `MessagesViewer` uses a proper `AlertDialog`; Projects/Skills/Experiences use `window.confirm`; Education, Courses, and Languages delete immediately with no confirmation at all.
- **Impact:** Users can permanently delete education/courses/languages rows by a single mis-click; the mixed patterns feel unpolished and untrustworthy for destructive actions.
- **Suggested fix:** Route all deletions through a shared `ConfirmDialog` (AlertDialog) component with the row name and a destructive confirm button.
- **Effort:** M
- **Status:** Open

#### UX-002
- **ID:** UX-002
- **Severity:** Medium
- **Location:** `src/components/Contact.tsx`, `src/components/admin/PortfolioDataManager.tsx`, `src/hooks/*` (placeholderData), `src/components/Projects.tsx`
- **Problem:** States are uneven. Public `Projects` and `Skills` have empty states, but `Contact` has no loading state; `PortfolioDataManager` has no initial skeleton while `loadSavedDraft` runs; several hooks silently show static `placeholderData` instead of a loading indicator.
- **Impact:** Layout jumps, and users cannot tell the difference between "no data", "still loading", and "failed" — which is also how the DB-001/BUG-002 issues stay hidden.
- **Suggested fix:** Add explicit loading/empty/error states driven by `isLoading`/`isError` from React Query (skeletons for load, neutral empty copy, error with retry).
- **Effort:** M
- **Status:** Open

#### UX-003
- **ID:** UX-003
- **Severity:** Medium
- **Location:** `src/components/contact/ContactForm.tsx`, `src/hooks/useContactForm.ts`, `src/components/Contact.tsx`
- **Problem:** Submission feedback is toast-only (no inline success/error on the form). Anti-spam relies on `sessionStorage` (`useRateLimit`), which a visitor can clear, and the form has no `maxLength` attributes matching the Zod limits.
- **Impact:** Users who miss the toast may resubmit; limits are discoverable only after failure; spam controls are effectively cosmetic.
- **Suggested fix:** Add an inline success/error region (`aria-live`) on the form, add `maxLength` on inputs, and treat client rate limiting as UX-only (server-side enforcement per DB-011).
- **Effort:** M
- **Status:** Open

#### UX-004
- **ID:** UX-004
- **Severity:** Medium
- **Location:** `src/components/skills/SkillCard.tsx:30-47`, `src/components/experience/ExperienceCard.tsx:31-86`, `src/components/admin/profile/ProfileTagsManager.tsx:34-37`, `src/components/projects/ProjectFilters.tsx:44-49`
- **Problem:** `SkillCard` is a clickable `<div>` (no `role`, `tabIndex`, or key handler); the Experience card trigger is a `<div>` rather than a button; tag removal is an `<X onClick>` icon (not focusable); the ProjectFilters trigger button is icon-only with no `aria-label`.
- **Impact:** Keyboard and screen-reader users cannot activate these controls; WCAG 2.1 issues (2.1.1, 4.1.2).
- **Suggested fix:** Convert clickable `div`s to semantic `<button>`s (or add `role="button"`, `tabIndex={0}`, `onKeyDown`), make the X icon a `<button aria-label="Remove tag">`, and add `aria-label="Filters"` to the filter trigger.
- **Effort:** M
- **Status:** Open

#### UX-005
- **ID:** UX-005
- **Severity:** Medium
- **Location:** `src/components/FeedbackChat.tsx:195` (bot bubble `text-white` on `bg-card`), `src/pages/Admin.tsx`, `src/components/admin/*` (hardcoded `#FF6542`, `#912F40`, `#0A0908`, `#748386`), `src/components/About.tsx`
- **Problem:** The public site uses theme CSS variables (`theme-text`, `bg-card`, …) while the admin uses hardcoded hex colors; `FeedbackChat` renders white text on `bg-card`, which has low contrast in the light theme.
- **Impact:** Inconsistent look between public and admin; potential contrast failures (WCAG 1.4.3) in the chat in light mode.
- **Suggested fix:** Move admin to the shared theme tokens and replace hardcoded hexes with variables; set the chat bubble to a token-based foreground color per theme.
- **Effort:** M
- **Status:** Open

#### UX-006
- **ID:** UX-006
- **Severity:** Medium
- **Location:** `src/components/Hero.tsx:23-24`, `src/components/hero/HeroCTA.tsx`, `src/hooks/useProfile.ts`
- **Problem:** The hero headline uses the static `userProfile.name`/`userProfile.title` from `src/data/profile.ts` instead of `useProfile()`. Admin edits to `display_name`/`title` therefore never change the hero.
- **Impact:** Admin edits appear not to work (confusing), and the hero can disagree with the About section which does use the DB.
- **Suggested fix:** Consume `useProfile()` in `Hero.tsx` (with a sensible loading placeholder) so content is consistent.
- **Effort:** S
- **Status:** Open

#### UX-007
- **ID:** UX-007
- **Severity:** Low
- **Location:** `src/hooks/useSkills.ts:52-55`, `src/components/admin/SkillsEditor.tsx` (icon field)
- **Problem:** Skill icons are stored as react-icons names (e.g. `SiReact`); an unknown/typo'd name silently falls back to the generic `Code2` icon in `useSkills`.
- **Impact:** Admins can enter an invalid icon name and get no feedback; skills show a blank/generic icon with no error.
- **Suggested fix:** Validate the icon name against the imported icon set in the editor and show inline feedback; list valid options.
- **Effort:** S
- **Status:** Open

#### UX-008
- **ID:** UX-008
- **Severity:** Low
- **Location:** `src/pages/NotFound.tsx:9-41`, `src/components/FeedbackChat.tsx:9,36-41,53`
- **Problem:** The 404 page force-redirects to home after 5 seconds; the feedback chat sets an "unread" badge on every page load and writes `READ_KEY` to `localStorage` that is never read back.
- **Impact:** Users can be yanked away from the 404 unexpectedly; the unread badge is effectively permanent/meaningless.
- **Suggested fix:** Remove the auto-redirect (keep manual buttons) or make it opt-in; actually use `READ_KEY` to decide the unread state.
- **Effort:** S
- **Status:** Open

#### UX-009
- **ID:** UX-009
- **Severity:** Low
- **Location:** `src/pages/Admin.tsx:83-97`
- **Problem:** Eleven admin tabs are placed in a single `TabsList` inside an `overflow-x-auto` container.
- **Impact:** On small screens the tab strip requires horizontal scrolling and tabs are easy to miss — poor discoverability on mobile.
- **Suggested fix:** Use a responsive layout (wrapped tabs, a select on mobile, or grouped sections).
- **Effort:** S
- **Status:** Open

#### UX-010
- **ID:** UX-010
- **Severity:** Low
- **Location:** `src/components/SEO.tsx` (unused → BUG-012), `index.html:9-15`, `public/sitemap.xml`
- **Problem:** Because `SEO` is never mounted, per-route meta titles/descriptions/OG tags are not applied; only the static `index.html` values and `StructuredData` JSON-LD exist, and the sitemap lists only `/` and `/projects`.
- **Impact:** Poor link previews and weaker SEO for all pages. **Needs verification:** actual Lighthouse/SEO scores were not measured in this audit.
- **Suggested fix:** Mount `SEO` per page (or add a small `useDocumentMeta` hook), and ensure titles/descriptions are set for `/` and `/projects`.
- **Effort:** S
- **Status:** Open

---

## 4. Suggested Fix Order

### Phase 1 — Quick wins (low risk, high value)
1. **BUG-001** — Point the contact email at a real, verified recipient (unblocks actual leads).
2. **DB-002 + DB-003** — Add `feedback_messages` admin delete/read policies (stops the privacy leak and the silent no-op delete).
3. **BUG-003 + DB-004** — Honor `show_publicly` on read (client filter + DB policy).
4. **BUG-005** — Stop nulling `experience_years` on profile save.
5. **BUG-012 + ORG-007** — Wire up or delete the dead `SEO.tsx` and unused `useSiteImages`/`useSiteContentValue`.
6. **UX-001** — Add confirmations to the three editors that delete without warning.

### Phase 2 — Critical
7. **DB-001** — Commit the baseline schema migration for the 9 missing tables; then **DB-007** (public-read policies) and **DB-006** (unique constraints).
8. **DB-005** — Create/document the three storage buckets with least-privilege policies.
9. **BUG-002** — Remove the `maybeSingle()` ambiguity on `profiles`/`page_sections`.
10. **BUG-014** — Fix the lint errors so `npm run lint` can gate CI.

### Phase 3 — Refactors (structural)
11. **ORG-001 / ORG-002** — Introduce `src/services/*` and standardize admin data fetching on React Query.
12. **ORG-003 / ORG-004** — Enable TypeScript strictness incrementally and adopt generated DB types in editors.
13. **ORG-005 / ORG-006** — Split oversized editors and extract upload/snapshot logic into hooks.
14. **BUG-010 / UX-002 / UX-003 / UX-004** — Clean up `FeedbackChat` timers and add consistent loading/error/a11y handling.

---

## 5. Files Removed from `/docs` (Step 0)

The following files existed in `/docs` before this audit and were deleted so that only `AUDIT_REPORT.md` and `TASKS.md` remain:

| File | Notes |
| --- | --- |
| `docs/AUDIT.md` | Previous audit notes (TypeScript/performance focus). |
| `docs/IMPROVEMENT_PLAN.md` | Previous phased improvement roadmap. |
| `docs/README.md` | Index for the (now-removed) performance documentation set. |
| `docs/SUPABASE.md` | Supabase setup/migration runbook (project ref `ooefpodiqdupfpyqmaif`). |

> Note: `docs/README.md` referenced `PERFORMANCE_REVIEW.md`, `IMPLEMENTATION_SUMMARY.md`, `QUICK_REFERENCE.md`, and `VERIFICATION_CHECKLIST.md`, but those files were **not present** in the working tree at audit time, so only the four files above were removed. No files outside `/docs` were modified.

---

## 6. Open Questions / Assumptions

1. **Remote schema (DB-001/DB-006/DB-007):** The repository has no base-schema migration. This report assumes the remote project already has those 9 tables (evidenced by `types.ts` and the dashboard-based setup described in the removed `SUPABASE.md`). Confirm by running `npx supabase gen types typescript --linked` and `npx supabase db diff` — not executed in this audit.
2. **Multi-user intent:** `profiles` is treated as a singleton (`maybeSingle()`, hero/About). If multi-user is intended, DB-006's `profiles_singleton_uidx` should instead be a uniqueness on `user_id`.
3. **Contact recipient (BUG-001):** Assumed the intended owner address is `matosjax@gmail.com` (used in `send-error-report` and `ServiceUnavailable.tsx`). Confirm the real destination and a verified Resend sending domain (the current `onboarding@resend.dev` cannot deliver to arbitrary addresses).
4. **Storage buckets (DB-005):** Assumed all three buckets are intended to be public (the code uses `getPublicUrl`). If the CV in `documents` should be private, switch to signed URLs and tighten the policy.
5. **Resource reference:** All line references are against commit `ae25ec7` (branch `main`). Generated types (`types.ts`) show `PostgrestVersion: 13.0.5`.
6. **Verification limits:** This audit did not run Lighthouse, accessibility tooling, or the Supabase CLI against the live project; UI/SEO performance and remote-schema items are marked **Needs verification** where applicable.
7. **`CLOUD_ENABLED`:** Hardcoded `true` in `src/config/cloud.ts`, so the static `src/data/*` fallback path is currently unreachable in production; this report assumes it is a development convenience only.
