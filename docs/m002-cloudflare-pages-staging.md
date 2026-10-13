# M-002 — Cloudflare Pages staging frontend (owner connection required)

**Status: NOT DEPLOYED / HTTPS origin NOT VERIFIED — 13 October 2026.** Supabase staging exists; this runbook does **not** assert a Cloudflare project exists.

## Scope

This is a staging-only React/Vite static frontend. Project Supabase ref is pinned to `qfkjcjzwhewsbblgumco` by the build guard. No production/student accounts, secret keys, hosted mutations, or paid upgrades.

Cloudflare Pages uses the existing GitHub repository `ferdilpu-sudo/layarbelajar`; avoid scaffolding a new app. Connect with the project owner's Cloudflare Pages account from **Workers & Pages → Create application → Pages → Import existing Git repository**:

| Pages build setting | Exact configuration |
|---|---|
| Repository | `ferdilpu-sudo/layarbelajar` |
| Branch for stable staging site | `main` |
| Framework | React (Vite) |
| Root | Repository root |
| Build command | `npm run build:pages:staging` |
| Build output | `dist` |
| Node | 24 (already `.nvmrc`) |

For Cloudflare **production environment of this staging-only Pages project**, configure these build-time values in its environment settings:

| Environment variable | Value and constraints |
|---|---|
| `VITE_SUPABASE_URL` | `https://qfkjcjzwhewsbblgumco.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **Legacy public `anon` JWT** from this project; despite its existing variable name, do not use `sb_publishable_...` yet because current hosted Auth gateway/JWT contract is still under test |
| `VITE_APP_URL` | The **actual confirmed** stable HTTPS Pages origin, exactly `https://<assigned-name>.pages.dev`, or a real HTTPS custom origin, without slash/path |

The Pages slug and resulting `*.pages.dev` URL **cannot be assumed** before Cloudflare confirms them. If the site name is already taken, use the assigned name rather than fabricating an origin. Public keys embedded in Vite builds are **public**, not storage for secret/service-role values. Never add `VITE_SUPABASE_SERVICE_ROLE_KEY`, `VITE_PRIVATE_KEY`, password, credentials, Cloudflare token, or database URL to Pages frontend variables.

The guard `scripts/verify-staging-pages-build.mjs` **fails closed** for missing/wrong origin, wrong Supabase project, insecure URL, invalid/privileged public JWT, or suspicious `VITE_` variable names. It validates JWT *metadata shape* only, not cryptographic signature or actual hosted authentication; successful build is **not** proof the key works.

The repository's `public/_redirects` already supports client-side routes. Confirm browser refresh on `/login` and restricted admin paths after deployment. Avoid wildcard origin allowances for dynamic branch preview URLs; use only the confirmed stable HTTPS site origin for hosted Edge Function CORS.

## After Pages HTTPS is verified

1. Record the **real** stable origin and Cloudflare deployment result in `docs/m002-hosted-acceptance.md` (not credentials). Confirm an HTTPS 200, rendered login route, and that no secret-bearing bundle/config exists.
2. Set Edge Function secret `APP_ALLOWED_ORIGINS` in **Supabase staging** to that exact origin only; then verify the deployed runtime sees the setting. This is a server-side secret/configuration, not a `VITE_` frontend variable. Do not bypass or disable JWT checks.
3. Configure/verify hosted Auth: public signup disabled with password provider still enabled for admin-provisioned aliases. Do not infer Auth configuration from SQL or from Edge deployment status.
4. Run the protected GitHub Action `M-002 Hosted Staging Preflight (Read Only)` with `STAGING_PROJECT_REF`, `STAGING_SUPABASE_URL`, `STAGING_APP_ORIGIN` and secret `STAGING_ANON_KEY` configured in GitHub Environment `staging`. This is the **positive and negative CORS and anon RLS** check. Use synthetic staging accounts only for later full lifecycle tests.
5. Record Windows bootstrap, hosted login/provision/change/reset/deactivate, role matrix, expiry/refresh, network-failure and operational restore separately. Only then evaluate M-002 for Verified.

**NO CLOUD HOSTING DEPLOYMENT PERFORMED BY THIS COMMIT.** A passing offline Pages guard and local CI do not close TEST-002.

References: [Cloudflare React on Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/), [Cloudflare build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/), [Supabase auth/Edge env](https://supabase.com/docs/guides/functions/secrets).
