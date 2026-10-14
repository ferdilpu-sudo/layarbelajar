# M-002 — Staging operations, Free-plan recovery and service-limit gate

**As of 14 October 2026:** Review prepared; **backup export, isolated restore, effective rate-limit inspection and owner signoff remain NOT VERIFIED.** Only read-only staging inventory/size checks were executed here.

**Scope:** designated Supabase staging `qfkjcjzwhewsbblgumco`. Never use production data, run restore on hosted staging, invoke `supabase db reset` against hosted, or change billing. Prefer an isolated disposable local Docker/Postgres instance for restoration tests.

## Verified read-only baseline

- After Windows synthetic bootstrap: `auth.users=0`; `public.profiles=0`; synthetic `lbqa_win_%` and `lbqa_%` account counts = 0.
- `pg_database_size(current_database()) = 11,212,467` bytes at inspection (PostgreSQL DB size, **not** monthly plan usage).
- `storage.objects=0`; sum of object metadata sizes = 0; Security Advisor security lints = 0.
- Hosted migration history = `20261012154806_profiles_foundation`, matching renamed Git source on merged PR #22. Running `supabase migration list` on a safe linked staging workstation remains a separate read-only confirmation.

These measurements are snapshots, not proof of ongoing quota safety or disaster recovery.

## Free-plan assumptions requiring owner validation

Consult [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups), [Billing](https://supabase.com/docs/guides/platform/billing-on-supabase), [Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits), and [Production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) before final signoff.

- **Free:** no automatic downloadable daily backups; Supabase advises regular CLI `db dump` exports, stored safely **off-site**. Paid PITR is **not enabled/assumed**.
- At review, reference Free limits include 500 MB database size, 1 GB Storage, 50,000 MAU, 500,000 monthly Edge invocations and 2 million Realtime messages. These are reference plan allowances and **not** live measured usage.
- Free project may be paused for inactivity. Document the responsible person and a pre-class availability check. No uptime guarantee implied.
- Database dumps and Storage object bytes are **separate**. A database backup does not restore deleted Storage objects.
- Auth rate limits differ by endpoint and may be adjustable. Record the **effective project values** under Supabase Dashboard → Authentication → Rate Limits; do not infer they equal published defaults and do not stress-test hosted endpoints.

## Gate A — backup artifact, protected handling (NOT RUN)

1. On the owner's trusted Windows device, verify Supabase CLI and Docker locally; inspect the CLI's actual `supabase db dump --help` flags before execution. Confirm the CLI is linked **only** to designated staging, and inspect `supabase migration list` (read only).
2. Create an access-restricted, encrypted backup destination **outside** the repository, cloud Pages directory, chat, PR artifacts, and CI logs. Never commit a backup, project connection string, Postgres password, token, or private account data.
3. Use the [Supabase CLI backup/restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) to export separate **roles, schema and data** logical backup files from **staging**. Do not supply a connection URL containing a password as plain shell command text/history. Prefer an interactive, securely configured CLI connection method after inspecting local `--help`.
4. Record file names, file sizes, SHA-256 hashes, export timestamp, staged source project ref, and secure backup location **without its contents or secrets**. Validate that each artifact is nonempty where expected.
5. Keep backup retention and offline copy rules owner-controlled. Do not upload private SQL containing any account data to GitHub.

**Acceptance:** artifacts exist securely, integrity recorded, export error count zero. A successful export alone does **not** establish restore capability.

## Gate B — restore drill into an isolated, disposable target (NOT RUN)

1. Prepare a **fresh isolated local** test database/container, and verify twice that its host is loopback, **not** `*.supabase.co`. No existing non-disposable DB may be replaced. Version compatibility and reserved schemas/roles must be reviewed before restore.
2. Restore the exported artifacts following the official CLI/psql restore guide. Do not copy hosted secrets into the local target. Review errors, permissions, RLS and custom helper behavior. If role/schema conflicts occur, stop and diagnose without relaxing policy.
3. Compare the restored `public.profiles` schema/constraints, policy/grants, `private.profile_ready_v1`, `app_role` enum, and the expected empty dataset; verify migrations/history separately. Check Edge Functions and Auth settings as **separate configuration** (SQL dump does not prove service configuration).
4. If actual Storage objects are introduced later, separately export and restore test objects; today baseline is zero, so object-recovery gate remains future work.
5. Record PASS/FAIL, source backup SHA-256, restored target kind (local only), test commands, observed row counts and reviewer. Delete only the explicitly disposable target after review.

**Acceptance:** isolated restore + smoke checks PASS. Any restore mismatch means this gate stays BLOCKED; no remote reset, `db push` or remote history repair as a workaround.

## Gate C — quota and Auth rate-limit readiness (NOT RUN for live configuration)

1. Record effective active plan and quotas from the owner's Supabase dashboard, usage metrics, and per-endpoint **Authentication → Rate Limits**; record read-only observations only.
2. Agree owner thresholds for usage warnings and a response playbook before classroom onboarding. Do not equate the 11.2 MB snapshot with projected real workload.
3. Check expected request volume for login, token refresh and upcoming join/class endpoints, rate-limiting on server side, safe 429 UI behavior, and logging without secrets. Do not flood/test hosted API limits with synthetic bursts.
4. Confirm project availability before lessons, keep a recovery/export schedule and local offline teaching fallback. If paid features would be needed, stop for an explicit owner decision; no automatic upgrades.

## M-002 release rule

M-002 stays **IN PROGRESS** until the independent Gates A/B/C, CLI migration-history confirmation, and owner signoff have evidence in `plan.md`. The completed hosted Auth 5/5, 8/8, browser 9/9 and Windows synthetic bootstrap 4/4 **do not** count as backups or rate/quotas PASS.
