# M-002 — Hosted Supabase acceptance checklist (owner-controlled)

**Status: BLOCKED / NOT RUN** — no hosted project, cloud URL or secret has been supplied or accessed. This checklist does not authorize deploying personal student data.

## Environment & rollout
- Use a dedicated staging Supabase project; record region, allowed services and provider quotas **without writing secrets into Git**.
- Apply reviewed migrations and inspect RLS policies/grants in staging. Set public frontend `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` only; never use `SUPABASE_SERVICE_ROLE_KEY` in browser or Vite-prefixed environment keys.
- Deploy `account-admin` and `change-password` with JWT verification enabled, configure exact HTTPS `APP_ALLOWED_ORIGINS`, and verify an unauthorized Origin and preflight behavior.
- Disable public signup in Auth settings while leaving provider email/password login available for admin-provisioned `@accounts.invalid` aliases. Verify hosted provider actually accepts the synthetic alias.
- Confirm owner-only first-admin provisioning and secret-free credential handoff; keep service-role credentials in a trusted execution environment and never expose them in browser logs.

## Functional & security acceptance
- With dedicated **synthetic** staging accounts, test admin provision/duplicate/list/reset/deactivate, teacher/student login and mandatory password change, wrong password, logout, and pending/inactive access denial.
- Check RLS as anon, student, teacher, admin across exposed tables. Verify role cannot be escalated from client and `service_role` remains inaccessible to client.
- Exercise refresh rotation, expiry, foreground resume, and account deactivation mid-session. No refresh tokens or passwords may appear in persistent browser storage, screenshots, traces or telemetry.
- Verify failures on intermittent connectivity, revoked refresh token, timeouts and retries. Confirm a failed Auth password update never unlocks a pending user.
- Confirm backups, restore rehearsal, rate-limit/quotas and alerting before enabling real class data. Record validated staging project revision, CI results, reviewer and approval.
- On Windows owner terminal, execute the documented local-only bootstrap workflow in a disposable development environment and record PASS/FAIL without passwords.

## Evidence log
`Hosted project`: NOT PROVISIONED. `RLS/Origin/refresh staging`: NOT RUN. `Windows admin PTY`: NOT RUN.
`Supabase local integration`: PASS (19/19); `four-viewport local browser Auth`: PASS (12/12), [run 38253731459](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38253731459).

**Do not change M-002 status to Verified** until the applicable hosted/staging acceptance gates above have independently supported results.

## Tahap pra-penerimaan hosted (belum dieksekusi)

Runbook `docs/m002-staging-runbook.md` menyediakan manual, **read-only** GitHub Actions preflight. Empat hasil probe (GoTrue health, anon RLS, CORS `account-admin` dan `change-password`) perlu PASS sebelum percobaan hosted yang dapat memutasi akun. Preflight tidak memakai key service role dan tidak dapat membuktikan aturan role administrasi atau refresh JWT. **Status: NOT RUN** hingga staging owner terhubung dan dispatch manual yang terotorisasi. Jangan jalankan ke project produksi.
