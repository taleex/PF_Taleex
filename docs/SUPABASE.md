# Supabase database setup & migrations

Project ref: **`ooefpodiqdupfpyqmaif`**
Migrations: **`supabase/migrations/`**
Convenience bundle: **`supabase/manual/portfolio_content_backend.sql`**

The project started before the Supabase CLI was used, so the original tables
(`profiles`, `projects`, `experiences`, `skills`, `skill_categories`,
`contact_info`, `page_sections`, `site_content`, `site_images`, `user_roles`,
`contact_submissions`, `feedback_messages`) were created manually in the
dashboard. The CLI therefore has **no record** of the first five migrations.

Two of those five are **not idempotent** (`CREATE TABLE` / `CREATE TYPE` /
`ADD COLUMN` without guards, plus a `DELETE` + `INSERT` seed), so running them
again would fail or duplicate data. That is why you must **baseline** them
before using `supabase db push`.

---

## Option A — Dashboard SQL Editor (fastest, no install, no password)

1. Open the SQL editor:
   <https://supabase.com/dashboard/project/ooefpodiqdupfpyqmaif/sql/new>
2. Copy the whole of `supabase/manual/portfolio_content_backend.sql` and paste
   it into the editor.
3. Click **Run**.
4. The script is idempotent, so re-running it is safe.
5. Run the verification queries in the "Verify" section below.

This applies only the new portfolio-content changes. It does **not** create the
CLI migration history, so if you later switch to the CLI, follow Option B
(including the baseline step).

---

## Option B — Supabase CLI (recommended for future changes)

### Prerequisites

- Node.js 18+ (you already have Node 24)
- The database password for the project
  (Dashboard → Project Settings → Database → **Database password**)

You do **not** need a global install; use `npx`.

### 1. Log in and link

```bash
npx supabase@latest login
npx supabase@latest link --project-ref ooefpodiqdupfpyqmaif
```

`link` prompts for the database password. If it does not, pass it with
`-p "<password>"`.

### 2. Baseline the five pre-existing migrations

These already exist in the remote database, so mark them as applied **without
re-running them**:

```bash
npx supabase@latest migration repair --status applied \
  20251002114321 20251002143047 20251002144004 20251003183633 20251003192303
```

### 3. Push the new migrations

```bash
npx supabase@latest db push
```

This applies the five `20260929*` migrations (content schema, seeds, draft +
publish functions, contact privacy default). They are idempotent, so a retry is
safe.

### 4. Confirm

```bash
npx supabase@latest migration list
```

All ten migrations should show as applied locally **and** remotely.

---

## Verify (SQL Editor)

```sql
-- 1. New tables (expect 4 rows)
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('education', 'courses', 'languages', 'portfolio_content_drafts')
order by table_name;

-- 2. New profile columns (expect 4 rows)
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name in ('experience_label', 'open_to_remote', 'timezone', 'availability');

-- 3. Contact privacy column (expect 1 row)
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'contact_info'
  and column_name = 'show_publicly';

-- 4. Draft/publish functions (expect 2 rows)
select proname
from pg_proc
where proname in ('save_portfolio_draft', 'publish_portfolio_draft');

-- 5. New project case-study columns (expect 3 rows)
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'projects'
  and column_name in ('problem', 'highlights', 'what_i_would_improve');
```

Then open the app's Admin → **Portfolio Data**. "Export live JSON" should
include `education`, `courses`, and `languages` with no "not present in the
database" notice.

---

## Future changes

1. Create a migration file:

   ```bash
   npx supabase@latest migration new add_something
   ```

   This creates `supabase/migrations/<timestamp>_add_something.sql`.

2. Write the SQL in that file.
3. Apply it:

   ```bash
   npx supabase@latest db push
   ```

4. Never edit a migration that has already been applied — add a new one
   instead.

Useful extra commands:

| Command | Purpose |
| --- | --- |
| `npx supabase@latest migration list` | Local vs remote migration status |
| `npx supabase@latest db diff` | Preview schema differences |
| `npx supabase@latest db pull` | Pull the remote schema into a new migration |
| `npx supabase@latest gen types typescript --linked > src/integrations/supabase/types.ts` | Regenerate the TypeScript types |

> After any schema change, regenerate `src/integrations/supabase/types.ts` with
> the command above so the app's types stay in sync.

---

## What each new migration does

| File | Purpose |
| --- | --- |
| `20260929000000_restore_portfolio_content.sql` | Fails closed on the legacy v1 restore RPC |
| `20260929100000_portfolio_content_v2.sql` | Adds profile/contact/project columns, creates `education`/`courses`/`languages` (+ RLS, grants), seeds `page_sections` |
| `20260929110000_portfolio_sections_seed.sql` | Seeds education/courses/languages rows |
| `20260929130000_portfolio_snapshot_v2.sql` | Creates `portfolio_content_drafts` + `save_portfolio_draft()` / `publish_portfolio_draft()` (admin-only, server-side JSON validation, transactional upserts) |
| `20260929140000_private_contact_default.sql` | New contact rows default to private; existing phone rows marked private |

---

## Notes

- `supabase/manual/portfolio_content_backend.sql` is generated from the
  migrations above; the migrations remain the canonical source. The CLI only
  reads `supabase/migrations/`, so the bundle is never double-applied by
  `db push`.
- The JSON feature is resilient while the tables are missing: export/load skip
  absent tables and report them, and publishing falls back to direct writes.
  After you apply the migrations it automatically uses all twelve tables plus
  the database draft/publish functions.
