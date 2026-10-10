# Tasks

_Last updated: 2026-10-10_

Legend: `[x]` done · `[~]` SQL ready in `docs/sql/`, waiting to be applied on Supabase · `[ ]` open · Severity in parentheses · Details for each ID are in `AUDIT_REPORT.md`.

## Audit
- [x] Step 0: Clean /docs (removed `APP_REVIEW.md`)
- [x] Step 1: Understand project (stack, routes, data flow, Supabase usage)
- [x] Step 2A: Audit bugs
- [x] Step 2B: Audit organization and architecture
- [x] Step 2C: Audit Supabase and database
- [x] Step 2D: Audit UI/UX
- [x] Step 3: Write AUDIT_REPORT.md
- [x] Step 4: Write TASKS.md

## Supabase rollout (see SUPABASE_RUNBOOK.md)
- [x] Fix build errors after re-import
- [x] Write SQL scripts `docs/sql/01–03`
- [x] Client changes needed by the new policies (FeedbackChat, MessagesViewer)
- [x] Run 01, 02, 03 on Supabase (applied 2026-10-09; anon reads of feedback/contact now denied)
- [ ] Set secrets `CONTACT_EMAIL`, `ALERT_EMAIL`, `RESEND_API_KEY`; deploy functions (blocked: owner)
- [ ] Copy scripts into migrations + `migration repair`; regenerate types

## Supabase / DB
- [x] DB-002 (Critical): Lock down `feedback_messages` read/insert policies
- [x] DB-001 (High): Baseline migration for the 9 untracked tables and 3 storage buckets and their policies
- [x] DB-003 (High): Add admin DELETE policy on `feedback_messages`; check row count after delete
- [x] DB-004 (Medium): Add length limits to the `contact_submissions` insert policy
- [x] DB-005 (Medium): Add explicit GRANTs to migrations
- [x] DB-006 (Low): Add `created_at` and `category_id` indexes; verify the skills FK
- [ ] DB-007 (Low): Move skills seed out of migrations and make it idempotent
- [x] DB-008 (Low): Throttle `send-error-report` (SQL 04 applied 2026-10-10; `rate_limits` live, anon read denied)

## Bugs
- [x] BUG-001 (Critical): Replace placeholder contact email recipient
- [x] BUG-002 (High): Escape and validate contact email input in the edge function
- [x] BUG-003 (Medium): Replace in-memory rate limiting (SQL 04 applied 2026-10-10)
- [x] BUG-004 (Medium): Re-checked: already handled (email failure doesn't block success)
- [x] BUG-005 (Medium): Clear role cache on sign-out
- [x] BUG-006 (Low): Fix QueryClient Supabase retry check
- [x] BUG-007 (Low): Validate CV upload and add cache-busting
- [x] BUG-008 (Low): Remove `any`; return generic errors from the edge function

## Organization
- [ ] ORG-001 (Medium): Split oversized admin editors into hooks
- [ ] ORG-002 (Medium): Move admin to TanStack Query with cache invalidation
- [ ] ORG-003 (Low): Shared confirm-delete dialog
- [ ] ORG-004 (Low): Shared content types from generated DB types
- [x] ORG-005 (Low): Remove hardcoded alert email fallback

## UI/UX
- [ ] UX-001 (Medium): Replace `confirm()` with AlertDialog
- [ ] UX-002 (Medium): Add sign-out / back-home actions on the "not admin" screen
- [ ] UX-003 (Low): Refresh public data after admin saves
- [ ] UX-004 (Low): Verify image alt text (Needs verification)
- [ ] UX-005 (Low): File type and size limits on uploads
