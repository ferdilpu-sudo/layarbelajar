# M-002 — Hosted synthetic Auth acceptance (owner-controlled)

**Status: HOSTED BACKEND 8/8 PASS and PAGES BROWSER 9/9 PASS, both with independent cleanup; Windows/operations gates pending.** The earlier [read-only preflight](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38413892433) passed five checks. This is a separate, explicitly mutating validation step and must never be triggered by pull requests.

## Target and approval

- Supabase **staging only**: project ref `qfkjcjzwhewsbblgumco`, exact HTTPS URL `https://qfkjcjzwhewsbblgumco.supabase.co`. Origin `https://layarbelajar.pages.dev`.
- The workflow creates a maximum of three **disposable** accounts (`lbqa_<random>_admin`, `lbqa_<random>_teacher`, `lbqa_<random>_student`), using non-deliverable `@accounts.invalid` aliases and cryptographically random passwords.
- Before any creation, it checks GoTrue health and signup policy, then **requires empty** GoTrue users and empty `public.profiles`. Non-empty staging is a BLOCK, not an invitation to delete existing accounts.
- Only run manually after the reviewed branch is merged to `main`. GitHub Actions → **M-002 Hosted Synthetic Auth Acceptance** → Run workflow → enter `RUN_SYNTHETIC_STAGING_ONLY`.
- GitHub Environment **staging** must have two Environment secrets: `STAGING_ANON_KEY` (legacy public anon JWT) and **`STAGING_SERVICE_ROLE_KEY` (legacy service_role JWT)** from the **same staging project**. Never paste their values in chat, Git, issue comments, output logs, screenshots, or workflow inputs. Never add a service key to `VITE_` environment variables. Restrict environment deployment branches to `main` and enable required reviewers/branch protection before adding privileged credentials.

## Checks and cleanup

- Verify admin synthetic bootstrap and login; admin Edge provisioning of teacher/student; mandatory password change while pending; non-admin denied account-admin operations; wrong-password rejection; cross-user RLS and client role-edit denial.
- Verify real GoTrue refresh-token rotation; admin reset locks previously issued teacher token; teacher deactivation rejects Edge access and hides profile even using an earlier access token.
- Cleanup runs in `finally`, using only the exact generated synthetic emails/IDs; verify **zero Auth users and zero profiles** afterward. Never delete unrecognized users or run `supabase db reset` / `db push` against cloud. A runner killed externally may leave test accounts. If cleanup fails, **STOP**, review account list in Supabase Dashboard for `lbqa_` names and reconcile only those exact synthetic identities before any rerun.
- All credentials and tokens stay in transient runner memory; no screenshots, trace, artifacts, secret-bearing response or console output. The workflow does not run automatically or in pull-request CI.
- The existing migration-history drift (`20261012060000` Git versus `20261012154806` hosted) must not be altered as part of this test. Rate limits, restore rehearsal, Windows owner bootstrap, and browser hosted login are still separate M-002 gates.

## Evidence ledger

- Synthetic workflow: **RUN and PASS** via [38421090025](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38421090025); the original setup instructions are retained for future authorized runs.
- Local integration: 19/19 PASS; local browser Auth: 12/12 PASS (separate CI evidence in `plan.md`).
- Hosted Auth/CORS/RLS public and anon preflight: 5/5 PASS, [run 38413892433](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38413892433).
- **M-002 remains IN PROGRESS / NOT VERIFIED** until each hosted write, role, session, cleanup and remaining operational gate has independent passing evidence.


## Successful real staging execution — 13 October 2026

- [Manual hosted synthetic workflow run 38421090025](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38421090025) **SUCCESS** on merged main `6940e5e1`. Job reported eight independently named PASS groups and `HOSTED_SYNTHETIC_ACCEPTANCE_PASS: 8 bounded checks.`
- The cleanup gate `PASS hosted-acceptance cleanup-no-remaining-users` succeeded. A **separate** Supabase SQL query after the workflow returned zero Auth users, zero profiles, zero `lbqa_` Auth identities and zero `lbqa_` profiles. Security Advisor: 0 security lints.
- This validates staging GoTrue/Edge/PostgREST API and RLS with disposable identities; no hosted Cloudflare browser UI automation, Windows owner interactive bootstrap, restore/backup or operational limits were included.
- The original script/workflow remains manual-only and privileged to the staging Environment. Do not put `STAGING_SERVICE_ROLE_KEY` into frontend build settings, public repository variables or chat.
- **M-002 remains IN PROGRESS.** Move to browser Auth, Windows bootstrap, and operational gates; retain this run as proof rather than creating fresh users without need.

## Subsequent hosted browser proof

- [Browser Auth Chromium run 38425114268](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38425114268) PASS **9/9** on deployed Pages (four viewport sizes, admin UI provisioning, teacher/student password UX and cleanup). Distinct from this API 8/8 suite.
- Independent SQL returned 0 Auth users and 0 profiles. **M-002 is not yet Verified** pending Windows bootstrap, recovery/quotas review and migration history audit.
