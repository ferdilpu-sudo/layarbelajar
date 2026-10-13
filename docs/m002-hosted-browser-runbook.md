# M-002 — Hosted Cloudflare Pages browser Auth acceptance

**Status: CODE ONLY / HOSTED NOT RUN.** This is a new gate after [read-only preflight 38413892433](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38413892433) and [synthetic backend 38421090025](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38421090025) succeeded. Neither of those proves hydrated browser Auth on the actual Pages site.

## Strict scope and approvals

- Run only from merged `main` through **M-002 Hosted Pages Browser Auth QA** (manual `workflow_dispatch`).
- Target exact origin `https://layarbelajar.pages.dev` and Supabase project `qfkjcjzwhewsbblgumco`. Other origins and service projects are blocked.
- GitHub **Environment `staging`** must have `STAGING_ANON_KEY` (legacy public anon JWT) and `STAGING_SERVICE_ROLE_KEY` (legacy service_role JWT). Do not paste either key into chat, source, PR, Pages build, `VITE_` variables or logs. Protect the environment with `main` branch restrictions and reviewer approval where available.
- Open [hosted browser workflow](https://github.com/ferdilpu-sudo/layarbelajar/actions/workflows/hosted-browser-auth.yml) → **Run workflow** on `main` → type `RUN_HOSTED_BROWSER_QA`. The confirmation permits creation and deletion of at most three disposable identities with random passwords; **never use real students**.
- Both hosted Auth users and profiles must be empty before creating any fixture. An existing account stops the run with no deletion.

## Actual browser checks

- Verify HTTPS frontend `/login` renders HTML and Chromium hydrates its React UI.
- On four viewports **360, 768, 1280 and 1920**, sign in a synthetic admin through the real browser, verify account dashboard/management link, then log out.
- From the admin UI provision synthetic **teacher and student** accounts. Read their one-time passwords **in-memory only**.
- Teacher on mobile and student on tablet: first login routes to `/ganti-password`; SPA navigation to `/admin/akun` remains forbidden while pending; password change via UI unlocks the correct role; direct SPA navigation does not elevate privileges; browser local/session storage remains empty; reload requires fresh login.
- Route browser requests only to the exact Pages and staging Supabase origins. Abort unknown third-party calls rather than leak temporary credentials.
- Close every browser context. Delete only exact synthetic user IDs/emails in `finally`, including users created when a response was lost; verify both Auth users and profiles return to **0**. Print only fixed PASS/FAIL gate labels. No screenshots, video, trace, request-body dumps or credential-bearing artifacts.
- Successful script prints `HOSTED_BROWSER_AUTH_PASS: 9 bounded checks.`. Any cleanup failure is **BLOCKED**; do not rerun until inspecting only marked `lbqa_` test identities on staging.

## Evidence and limits

- **Hosted Pages browser QA: NOT RUN** until owner dispatches merged workflow. Offline CI contracts assert fail-closed configuration and empty staging gates; they are not browser success.
- Existing backend Auth 8/8 stays PASS, not rerun here. This test covers **hydrated UX and browser navigation**, not production rollout, cross-device persistence, every networking failure scenario, full accessibility, Windows owner-terminal bootstrap, hosted backup/restore rehearsal, quotas/rate-limits or Git/hosted migration history reconciliation.
- **M-002 remains IN PROGRESS / NOT VERIFIED** pending independent browser run and remaining operating gates.
