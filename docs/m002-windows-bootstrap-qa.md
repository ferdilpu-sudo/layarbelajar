# M-002 — Windows staging synthetic admin bootstrap QA

**Status: Windows owner runtime NOT RUN.** This is distinct from the local-only `bootstrap-admin.mjs`. Hosted Auth browser 9/9 and backend 8/8 have passed; this specifically checks a **real interactive Windows terminal**, never creates a permanent owner/admin.

## Safe host and scope

- Run on the owner's **trusted Windows PC** from a fresh interactive PowerShell or Windows Terminal. Node.js 24 recommended. Do not use GitHub Actions, an AI chat terminal, a noninteractive pipe, remote screen recording, shell echo, or screenshots of the credential prompts.
- The script requires `process.platform === 'win32'`, a real TTY and **no command-line arguments**. It hard-pins Supabase staging `qfkjcjzwhewsbblgumco`. No service-role key is saved to source, config files, environment, shell history or logs by the script.
- Two secret prompts are hidden: legacy public `anon` JWT, legacy **service_role** JWT. Both come from **the same designated Supabase staging project** (Supabase Dashboard → Settings → API Keys → Legacy). Never use production service keys or paste credentials into ChatGPT, PRs, commits or shared logs.
- The operator enters a **temporary synthetic** admin password of 12–128 characters, twice, in hidden prompts. Do not reuse a real account password. No real person's name or account is requested. Enter the literal confirmation `BOOTSTRAP_SYNTHETIC_STAGING` **only after** the preflight passes.
- Nothing is written before real GoTrue health/settings checks and exact inventory **zero Auth users and zero profiles**. Non-empty staging aborts without touching existing accounts.

## Windows owner command

From a fresh repository checkout updated to merged `main`:

```powershell
cd C:\Users\FLYONZ\Documents\GitHub\layarbelajar
git switch main
git pull --ff-only
node --version
npm run qa:bootstrap:windows:staging
```

If the folder differs, navigate to the actual checkout rather than creating a new clone.

Expected safe log markers, with no secret values:

```text
PASS windows-bootstrap preflight-empty-staging
PASS windows-bootstrap admin-created
PASS windows-bootstrap admin-login-and-profile
PASS windows-bootstrap cleanup-empty-staging
WINDOWS_STAGING_BOOTSTRAP_PASS: 4 bounded checks.
```

The test creates at most **one** synthetic account using `lbqa_win_<random>_admin@accounts.invalid`. It creates the linked `profiles` row, logs into hosted Auth with the temporary password, checks the active admin's own RLS-protected profile, deletes only that run's synthetic Auth ID, and checks both Auth users and profiles return to **zero**. Any partial failure attempts cleanup in `finally` (including reconciliation of a response-lost user by its exact generated email).

## Recovery and evidence

- If `WINDOWS_BOOTSTRAP_CLEANUP_BLOCKED` appears, **do not rerun**. On the Supabase staging dashboard, inspect only identities prefixed `lbqa_win_`; reconcile exact identities before further testing. Never reset the database, delete unknown accounts, or run `supabase db push`.
- If a power loss, process kill or Windows crash interrupts the test, `finally` cannot run. Recheck the staging user inventory before restarting.
- Send **only** the final PASS/FAIL marker, Node version and commit SHA to the reviewer, never JWTs or a screenshot of hidden prompts. Reviewer independently checks `auth.users=0`, `public.profiles=0`, no `lbqa_win_` identities, and records the checkpoint in `plan.md`.
- The legacy local script `npm run bootstrap:admin` remains loopback-only. Do not remove its local URL guard or repurpose it for hosted staging.
- This covers Windows terminal input + synthetic hosted bootstrap and cleanup, **not** the permanent owner credential ceremony, database backup/restore, quota/rate-limits or unresolved hosted migration version mismatch. **M-002 remains IN PROGRESS / NOT VERIFIED.**
