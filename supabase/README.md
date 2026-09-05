# BabaWina Supabase schema (live dump)

Structure-only snapshot exported from the live project on **2026-09-05**.

No table row data, no user emails, no payment records, and no API keys.

## Files

| File | What it is |
|---|---|
| `schema.sql` | Restorable DDL: enums, tables, indexes, FKs, functions, triggers, RLS policies, storage buckets |
| `schema.json` | The live JSON dump you exported from the SQL Editor |
| `buckets.json` | Storage bucket metadata (no files) |

## What was captured

- 3 enums: `competition_status`, `processing_status`, `user_role`
- 12 tables with columns, defaults, indexes, FKs, checks, RLS, and policies
- 22 public functions (full bodies)
- 6 storage buckets
- Auth signup helper `handle_new_user()` plus the `auth.users` trigger to recreate profiles

`temp_entries` is **not** in the live database (only referenced by an old local script).

## Restore on a new Supabase project

1. Create a new project.
2. Open the SQL Editor and run `schema.sql`.
3. Confirm storage buckets exist under **Storage**. Public-read policies on public buckets may still need to be added in the dashboard if uploads/reads fail.
4. Create your admin after signup:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
```

5. Storage objects (competition photos, etc.) are **not** in this dump. Re-upload those separately if you need them.

## Notes

- Foreign-key `on_delete` codes from the dump: `c` = CASCADE, `n` = SET NULL, `a` = NO ACTION.
- Policy roles of `-` mean PUBLIC (all roles).
- `determine_winners_after_end_time()` references `competitions.end_date`, which is **not** a live column (`ends_at` is). That function is saved as-is from production.
