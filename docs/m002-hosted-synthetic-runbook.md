# M-002 — Hosted synthetic Auth acceptance (owner-controlled)

**Status: CODE REVIEW / NOT RUN on hosted.** The earlier [read-only preflight](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38413892433) passed five checks. This is a separate, explicitly mutating validation step and must never be triggered by pull requests.

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

- Synthetic workflow: **NOT RUN** until owner configures the privileged environment secret and manually authorizes workflow dispatch.
- Local integration: 19/19 PASS; local browser Auth: 12/12 PASS (separate CI evidence in `plan.md`).
- Hosted Auth/CORS/RLS public and anon preflight: 5/5 PASS, [run 38413892433](https://github.com/ferdilpu-sudo/layarbelajar/actions/runs/38413892433).
- **M-002 remains IN PROGRESS / NOT VERIFIED** until each hosted write, role, session, cleanup and remaining operational gate has independent passing evidence.
