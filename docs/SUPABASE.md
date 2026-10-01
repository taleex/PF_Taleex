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
npx supabase@latest migration list --linked

npx supabase@latest migration repair --status applied --linked \
  20251002114321 20251002143047 20251002144004 20251003183633 20251003192303
```

### 3. Preview, then push the new migrations

```bash
npx supabase@latest db push --dry-run --linked   # should list only the 20260929* files
npx supabase@latest db push --linked
```

This applies the five `20260929*` migrations (content schema, seeds, draft +
publish functions, contact privacy default). They are idempotent, so a retry is
safe.

### 4. Confirm

```bash
npx supabase@latest migration list --linked
```

All ten migrations should show as applied locally **and** remotely.

> These commands prompt for your database password. To skip the prompt, append
> `-p "<database-password>"`. The CLI stores its local state in
> `supabase/.temp/`, which is gitignored.

---

## Troubleshooting: `Connection timed out`

### Symptom

```
Initialising login role...
Connecting to remote database...
failed to connect to postgres: failed to connect to
`host=db.ooefpodiqdupfpyqmaif.supabase.co user=cli_login_postgres database=postgres`:
Connection timed out
```

### Cause

Supabase's **direct** database host (`db.<ref>.supabase.co`) is **IPv6-only** —
it publishes no `A` record:

```bash
getent ahosts db.ooefpodiqdupfpyqmaif.supabase.co
# 2a05:d012:5aa:c902:bfea:9d0e:8bf3:3386 STREAM db.ooefpodiqdupfpyqmaif.supabase.co
```

If your network has no working IPv6 route (or a VPN is blackholing IPv6), every
CLI `--linked` command times out. A ProtonVPN-style IPv6 leak-protection
interface (`ipv6leakintrf0`) does exactly that.

Diagnose:

```bash
ip -6 addr show scope global | grep -c inet6                                 # 0 = no IPv6
ip -6 route show default
curl -6 -s -m 6 -o /dev/null -w '%{http_code}\n' https://ipv6.google.com     # must print 200
```

### Fix 1 — use the IPv4 connection pooler (most reliable)

The pooler host has `A` records, so it works on IPv4-only networks. The exact
host is already cached by `supabase link`:

```bash
cat supabase/.temp/pooler-url
# postgresql://postgres.ooefpodiqdupfpyqmaif@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
```

Append the database password and pass the whole string via `--db-url`:

```bash
DBURL='postgresql://postgres.ooefpodiqdupfpyqmaif:PASSWORD@aws-1-eu-west-3.pooler.supabase.com:5432/postgres'

npx supabase@latest migration repair --status applied --db-url "$DBURL" \
  20251002114321 20251002143047 20251002144004 20251003183633 20251003192303

npx supabase@latest db push --db-url "$DBURL"
```

Percent-encode a password containing `@ : / # ? &`:

```bash
python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" 'my#pass'
```

Use the **session** pooler (port `5432`). The transaction pooler (`6543`) cannot
run migrations.

### Fix 2 — repair IPv6

- Disconnect the VPN (or disable its IPv6 leak protection), then retry `--linked`.
- Or enable the **IPv4 add-on** for the project (Dashboard → Project Settings →
  Add-ons) so `db.<ref>.supabase.co` gets a real IPv4 address.

### Fix 3 — skip the CLI entirely

Paste `supabase/manual/portfolio_content_backend.sql` into the
[SQL Editor](https://supabase.com/dashboard/project/ooefpodiqdupfpyqmaif/sql/new).
To keep the CLI history in sync afterwards, run this once in the same editor:

```sql
create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (
  version text not null primary key,
  statements text[],
  name text
);
insert into supabase_migrations.schema_migrations (version, name) values
  ('20251002114321', 'bbb5f312-c184-4d54-a6d2-535fd50037dc'),
  ('20251002143047', '73bf246f-0427-4b64-b1b1-2e2cd63beaaf'),
  ('20251002144004', 'db6f0029-cd4b-4583-a20a-e59ce07646f8'),
  ('20251003183633', '48467e97-ebda-4d77-93bd-aa747c7a8bd6'),
  ('20251003192303', '89cf33f3-5f7a-4e4c-adbc-0c9db2cebd9c')
on conflict (version) do nothing;
```

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
