# M-002 — Hosted Supabase acceptance checklist (owner-controlled)

**Status: PARTIAL HOSTED SETUP / ACCEPTANCE NOT RUN** — dedicated Free staging exists; profiles foundation is present and both Edge Functions are deployed, but hosted authentication/CORS/session acceptance remains unverified. This checklist does not authorize deploying personal student data.

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
`Hosted project`: PROVISIONED (staging only). `RLS schema/grants`: SQL inspection PASS; `HTTP RLS/Origin/refresh staging`: NOT RUN. `Windows admin PTY`: NOT RUN.
`Supabase local integration`: PASS (19/19); `four-viewport local browser Auth`: PASS (12/12), [run 38253731459](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38253731459).

**Do not change M-002 status to Verified** until the applicable hosted/staging acceptance gates above have independently supported results.

## Tahap pra-penerimaan hosted (belum dieksekusi)

Runbook `docs/m002-staging-runbook.md` menyediakan manual, **read-only** GitHub Actions preflight. Empat hasil probe (GoTrue health, anon RLS, CORS `account-admin` dan `change-password`) perlu PASS sebelum percobaan hosted yang dapat memutasi akun. Preflight tidak memakai key service role dan tidak dapat membuktikan aturan role administrasi atau refresh JWT. **Status: NOT RUN** hingga staging owner terhubung dan dispatch manual yang terotorisasi. Jangan jalankan ke project produksi.

## Bukti konsolidasi PR #6

- Code preflight manual serta runbook: [PR#6 — Merged](https://github.com/ferdilpu-sudo/layarbelajar/pull/6), commit `70ce905a`.
- **Offline contract:** 5/5 PASS pada [CI 38261146059](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38261146059).
- **Main CI setelah merge:** [38261732399](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38261732399) PASS.
- **Staging read-only execution:** NOT RUN; project hosted belum dikonfirmasi tersedia/terhubung pada agent. **End-to-end hosted:** NOT RUN. Konfigurasi selanjutnya harus dilakukan pemilik pada GitHub environment `staging` atau melalui integrasi Supabase yang terhubung, tidak dengan mengirim secret ke chat.

## Live staging provisioning checkpoint — 12 Oktober 2026

- Supabase project Free `layarbelajar-staging` ref `qfkjcjzwhewsbblgumco`, region `ap-southeast-1`, status ACTIVE_HEALTHY, biaya diketahui USD 0/month. Khusus staging, belum ada user siswa nyata.
- `profiles_foundation` applied; hosted migration record `20261012154806` **tidak sama** dengan sumber Git `20261012060000`; jangan lakukan `db push` tanpa pemeriksaan/rekonsiliasi histori.
- Database SQL checks: RLS enabled; anon SELECT denied; authenticated INSERT/UPDATE/DELETE denied, only one self-ready SELECT policy. Security advisor no lints, rows=0.
- **Blocked:** hosted Auth signup disabled/email provider compatibility still unverified, app origin HTTPS belum ditetapkan, Edge Functions belum deployed, acceptance login/role/CORS/refresh hosted NOT RUN, bootstrap Windows NOT RUN. Staging project creation and DB schema PASS tidak menutup M-002.

## Supabase Edge deployment checkpoint — 13 Oktober 2026

- Project `qfkjcjzwhewsbblgumco` ACTIVE_HEALTHY; Auth user count 0; profile count 0.
- `account-admin` and `change-password` **ACTIVE version 1**, `verify_jwt=true`, deployed to this staging project, and retrievable hosted files equal the GitHub `9330e679` source entrypoints + shared helper (exact string comparison). Status here means successful deployment/control-plane listing, **not HTTP invocation**.
- Security Advisor 0 lints. Private helper denies EXECUTE to `anon`; grants and one `profiles_select_self_ready_v1` RLS policy match initial contract at the inspected granularity.
- Supabase hosted **Auth signup policy, credential alias compatibility, `APP_ALLOWED_ORIGINS` / approved HTTPS site origin, GET/OPTIONS + negative Origin, pending/reset/deactivate + refresh, operational backup/restore and owner Windows bootstrap are NOT RUN or NOT VERIFIED**. Explicitly do not call this TEST-002 PASS.
- Migration history mismatch (`20261012154806` hosted vs `20261012060000` in Git) remains blocked from automatic `db push`.

## M-002 — Actual hosted public HTTP negative smoke, 13 Oktober 2026

- Script `scripts/staging-public-smoke.mjs` dan workflow `.github/workflows/staging-public-smoke.yml` melakukan request **GET / OPTIONS saja**, tanpa key, bearer, password, cookies, body, pembuatan akun maupun data siswa. Target dibatasi eksplisit ke staging `qfkjcjzwhewsbblgumco`, tidak ada network mutable/proyek produksi.
- GitHub Actions [run 38334648904](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38334648904) **PASS 3/3 offline unit + 5/5 actual hosted read-only requests**: Auth health tanpa key mengembalikan **HTTP 401** (gateway memerlukan API key, **bukan bukti GoTrue health 200**); `account-admin` dan `change-password` menolak anonim; `Origin: https://untrusted.invalid` tidak menerima CORS `Access-Control-Allow-Origin` yang cocok/wildcard.
- Lingkup hanya negative/no-credentials. Ini **tidak** membuktikan public-key / user JWT bekerja, CORS origin HTTPS valid, Auth signup disabled, profile RLS via HTTP, alias `@accounts.invalid`, lifecycle admin/guru/siswa, refresh token, Windows bootstrap, atau backup/restore. **M-002 IN PROGRESS / NOT VERIFIED**.
