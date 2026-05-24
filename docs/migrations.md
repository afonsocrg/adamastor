# Database migrations

Adamastor uses Supabase Postgres. Schema changes are version-controlled as SQL files in [`supabase/migrations/`](../supabase/migrations/).

## Workflow

1. **Write a migration file** in `supabase/migrations/` named `YYYYMMDDHHMMSS_short_description.sql` (e.g. `20260524180000_add_event_submission_workflow.sql`). Timestamps sort lexicographically; pick a value later than the most recent file.
2. **Wrap in a transaction**: start with `begin;`, end with `commit;`. If anything fails midway, the whole migration rolls back.
3. **Apply manually** by pasting the SQL into the Supabase dashboard's SQL editor and running it. The CLI's `supabase db push` is *not* used in this project today, and the Supabase MCP `apply_migration` tool can't find the project from its dashboard listing.
4. **Commit the file** alongside the code change so peers and CI can see the schema delta.

## Conventions

### Idempotent guards

Wrap DDL in `if not exists` / `drop if exists` so re-running the same migration is safe:

```sql
create table if not exists public.foo ( ... );

drop policy if exists "Public can read foo" on public.foo;
create policy "Public can read foo" on public.foo for select using (true);
```

For constraints (which don't accept `if not exists` in Postgres 15), use a `do $$ begin ... end $$` block:

```sql
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'foo_status_check') then
        alter table public.foo add constraint foo_status_check check (status in ('a', 'b'));
    end if;
end $$;
```

### RLS is mandatory on new tables

Every new table must:
1. `alter table public.<name> enable row level security;`
2. Ship at least one policy in the same migration.

If you intentionally want a public-readable table, write `for select using (true)` rather than leaving RLS off. Document the choice in a comment.

### Pre-existing data needs a backfill

If you add a NOT NULL column to a populated table, you need either a `default` clause that satisfies existing rows, or a separate `update` step inside the same migration. See `20260524180000_add_event_submission_workflow.sql` for the pattern (and why the where-clause reads as a no-op safety belt).

### Comment your decisions

Whoever runs the migration in the Supabase dashboard reads the SQL once. Inline comments explaining *why* (not just *what*) save the next person from re-deriving the design.

## Local Supabase

`supabase/config.toml` ships a local stack config. To work against it: `supabase start` (CLI). Most contributors point straight at the shared Supabase project via `NEXT_PUBLIC_SUPABASE_URL` and don't run the local stack.

## Rolling back

There's no automated rollback. Either:
- Write and run a reverse migration (`drop column ...`, etc.) as a new dated file.
- Or restore from a Supabase backup (project dashboard → Database → Backups).

Prefer forward fixes (new migration) over rollback when the change has already landed in shared environments.
