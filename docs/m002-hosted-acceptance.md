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

## Cloudflare staging frontend deployment readiness — 13 October 2026

- Repository staging build gate and test contract are implemented on `feat/m002-cloudflare-staging-build-gate`, with project-bound origin checks and no privileged frontend keys. CI evidence will be added after the final commit is checked.
- **Cloudflare Pages project: NOT VERIFIED / NOT DEPLOYED**; stable HTTPS origin NOT VERIFIED; `APP_ALLOWED_ORIGINS` exact allowlist NOT VERIFIED; positive CORS/browser login/refresh remain NOT RUN. Staging Supabase Edge deployment and public negative HTTP smoke from earlier checkpoints remain PASS within their stated limited scope.
- Next steps are actual Pages owner connection, assigned hostname verification, backend allowlist setup, protected preflight and full hosted synthetic account acceptance. M-002 IN PROGRESS / NOT VERIFIED.

## M-002 — Live Cloudflare Pages deployment and route proof (13 October 2026)

- Owner Pages build log for Git 9508e852: `STAGING_PAGES_BUILD_PASS`, `STAGING_SITE_ORIGIN: https://layarbelajar.pages.dev`, 97 transformed Vite modules, `Assets published!`, and `Your site was deployed!`. Build and publication PASS; does not prove hosted Auth.
- Published Pages HTTP smoke: GitHub Actions [38354227693](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38354227693) PASS: 3/3 offline tests, actual HTTP GET 200 React HTML shell for `/`, `/login`, `/gabung`, `/admin/akun`, plus bundled JavaScript asset PASS. These are read-only checks, NOT verified JS hydration, signed-in browser behavior or protected actions.
- Cloudflare warned that `/* /index.html 200` was an ignored infinite-loop rewrite. Remove `public/_redirects`: Cloudflare Pages native SPA fallback supports React Router if there is no root `404.html` (https://developers.cloudflare.com/pages/configuration/serving-pages/). Verify warning gone when fixed Git commit deploys.
- Exact Supabase staging secret value to configure after deploy: `APP_ALLOWED_ORIGINS=https://layarbelajar.pages.dev` — NOT CONFIGURED/NOT VERIFIED here. Hosted positive CORS, public-signup disable, synthetic user login/reset, RLS role matrix, refresh token, Windows bootstrap and restore remain NOT RUN. M-002 IN PROGRESS / NOT VERIFIED.

## M-002 — Approved-origin CORS read-only gate (13 October 2026)

- Pemilik menyatakan `APP_ALLOWED_ORIGINS=https://layarbelajar.pages.dev` telah disimpan pada Supabase staging. Klaim ini belum dianggap runtime PASS tanpa request nyata.
- `scripts/staging-public-smoke.mjs` diperluas dari negative-only menjadi **7 GET/OPTIONS probes**: Auth gateway no-key, dua Edge no-token denial, dua exact approved-origin CORS OPTIONS (termasuk `authorization` header), dua foreign-origin explicit denial. Hanya project Supabase `qfkjcjzwhewsbblgumco`, tanpa key/password/body/POST.
- Jalankan CI live `M-002 Hosted Public Smoke (No Credentials)` dan catat hasil pada PR. PASS tidak membuktikan login, refresh-token rotation, real browser, Auth signup disabled atau RLS cross-role. **M-002 In Progress**.

### Live approved-origin OPTIONS result — PASS (13 October 2026)

- GitHub Actions [M-002 Hosted Public Smoke 38356097250](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38356097250): **5/5 offline tests PASS; 7/7 actual hosted read-only probes PASS** against project `qfkjcjzwhewsbblgumco`.
- Both `account-admin` and `change-password`: approved origin **`https://layarbelajar.pages.dev`** returned the exact `Access-Control-Allow-Origin` and supported the `authorization` request header; foreign origin `https://untrusted.invalid` explicitly denied, and no-token GET rejected. Auth health without key still returned gateway key-required rather than proof of healthy GoTrue.
- Runtime secret value itself was never read or printed; the result only demonstrates the **effective CORS behavior** matching the allowed origin. No user authentication/roles, credentialed browser, public signup, session refresh or backup were tested.
- **M-002 IN PROGRESS / NOT VERIFIED.** Next: secret-scoped read-only GoTrue/anon RLS preflight, then approved synthetic accounts, hosted role/refresh acceptance and Windows owner bootstrap.
