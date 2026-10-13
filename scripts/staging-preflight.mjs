import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const UNTRUSTED_ORIGIN = 'https://untrusted.invalid';
// Match the confirmed staging infrastructure; reject accidental production probes.
const EXPECTED_STAGING_REF = 'qfkjcjzwhewsbblgumco';
const EXPECTED_APP_ORIGIN = 'https://layarbelajar.pages.dev';
const EDGE_NAMES = ['account-admin', 'change-password'];

function fail(reason) {
  throw new Error('STAGING_PREFLIGHT_BLOCKED: ' + reason);
}

export function validateHostedConfig(env) {
  const urlString = env.STAGING_SUPABASE_URL;
  const ref = env.STAGING_PROJECT_REF;
  const originString = env.STAGING_APP_ORIGIN;
  const key = env.STAGING_ANON_KEY;
  if (![urlString, ref, originString, key].every((v) => typeof v === 'string' && v.length)) {
    fail('Required staging configuration is missing.');
  }
  if (!/^[a-z0-9]{8,40}$/.test(ref) || ref !== EXPECTED_STAGING_REF) {
    fail('Project ref does not match the dedicated LayarBelajar staging project.');
  }
  let url;
  let origin;
  try {
    url = new URL(urlString);
    origin = new URL(originString);
  } catch {
    fail('Invalid staging URL or frontend origin.');
  }
  // Strict allowlisting makes this read-only script unable to probe arbitrary hosts.
  if (
    url.protocol !== 'https:' ||
    url.hostname !== ref + '.supabase.co' ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    fail('Staging URL must be the exact HTTPS Supabase project URL.');
  }
  if (
    origin.protocol !== 'https:' ||
    !origin.hostname ||
    origin.username ||
    origin.password ||
    origin.port ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    origin.origin === url.origin ||
    origin.hostname.endsWith('.supabase.co') ||
    origin.origin !== EXPECTED_APP_ORIGIN
  ) {
    fail('Frontend origin must be a separate exact HTTPS site origin.');
  }
  // Hosted Edge functions currently use verify_jwt=true, so the existing app
  // contract requires the legacy anon JWT, not a new opaque publishable key.
  // Do not allow a service_role JWT even when it was mistakenly configured.
  const chunks = key.split('.');
  if (chunks.length !== 3)
    fail('Expected legacy anon JWT; opaque publishable keys are not yet supported.');
  let payload;
  try {
    payload = JSON.parse(Buffer.from(chunks[1], 'base64url').toString('utf8'));
  } catch {
    fail('Invalid staging public JWT.');
  }
  if (payload?.role !== 'anon' || payload?.iss !== 'supabase') {
    fail('Staging key must have the anon role; never supply a service-role key.');
  }
  if (typeof payload.exp === 'number' && payload.exp <= Math.floor(Date.now() / 1000)) {
    fail('The configured anon JWT has expired.');
  }
  return { url: url.origin, origin: origin.origin, key };
}

async function limitedFetch(fetcher, url, options) {
  const response = await fetcher(url, {
    ...options,
    redirect: 'manual',
    signal: AbortSignal.timeout(12_000),
  });
  if (response.status >= 300 && response.status < 400) {
    fail('Unexpected redirect; staging endpoint must not redirect.');
  }
  return response;
}

export async function checkHostedStaging(config, fetcher = fetch) {
  const reports = [];
  const headers = { apikey: config.key, Authorization: 'Bearer ' + config.key };
  const health = await limitedFetch(fetcher, config.url + '/auth/v1/health', {
    method: 'GET',
    headers,
  });
  if (health.status !== 200) fail('Auth health check failed with HTTP ' + health.status + '.');
  reports.push('auth-health');

  // GoTrue publicly exposes these policy flags via GET /settings. Assert that
  // self-registration is disabled but email/password sign-in stays enabled.
  const settings = await limitedFetch(fetcher, config.url + '/auth/v1/settings', {
    method: 'GET',
    headers,
  });
  if (settings.status !== 200) {
    fail('Auth settings check failed with HTTP ' + settings.status + '.');
  }
  let policy;
  try {
    policy = await settings.json();
  } catch {
    fail('Invalid Auth settings response.');
  }
  if (policy?.disable_signup !== true) fail('Hosted Auth must disable public signup.');
  if (policy?.external?.email !== true) fail('Hosted Auth email login provider is disabled.');
  reports.push('auth-policy');

  // This GET is read-only. Public grants/RLS must never reveal any profile rows.
  const profiles = await limitedFetch(fetcher, config.url + '/rest/v1/profiles?select=id&limit=1', {
    method: 'GET',
    headers,
  });
  if (profiles.status === 200) {
    let rows;
    try {
      rows = await profiles.json();
    } catch {
      fail('Unexpected anonymous profiles response.');
    }
    if (!Array.isArray(rows) || rows.length !== 0) fail('Anonymous access exposed profile data.');
  } else if (![401, 403].includes(profiles.status)) {
    fail('Unexpected anonymous profiles HTTP ' + profiles.status + '.');
  }
  reports.push('anon-rls');

  for (const name of EDGE_NAMES) {
    const path = config.url + '/functions/v1/' + name;
    const preflight = {
      method: 'OPTIONS',
      headers: {
        Origin: config.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,apikey,content-type',
      },
    };
    const allowed = await limitedFetch(fetcher, path, preflight);
    if (![200, 204].includes(allowed.status)) {
      fail(name + ': approved-origin CORS preflight failed (HTTP ' + allowed.status + ').');
    }
    if (allowed.headers.get('access-control-allow-origin') !== config.origin) {
      fail(name + ': missing exact approved-origin CORS header.');
    }
    if (
      !String(allowed.headers.get('access-control-allow-headers') ?? '')
        .toLowerCase()
        .includes('authorization')
    ) {
      fail(name + ': authorization header not allowed in CORS.');
    }
    const blocked = await limitedFetch(fetcher, path, {
      ...preflight,
      headers: { ...preflight.headers, Origin: UNTRUSTED_ORIGIN },
    });
    if (blocked.headers.get('access-control-allow-origin')) {
      fail(name + ': unauthorized Origin was allowed by CORS.');
    }
    if (![401, 403].includes(blocked.status)) {
      fail(name + ': unauthorized Origin was not explicitly denied.');
    }
    reports.push(name + '-cors');
  }

  // Never send a password, create an account, reset a database, or issue a POST.
  return reports;
}

export async function main(env = process.env, fetcher = fetch) {
  const config = validateHostedConfig(env);
  const reports = await checkHostedStaging(config, fetcher);
  for (const report of reports) {
    console.log('PASS staging-readonly ' + report);
  }
  console.log('STAGING_READONLY_PASS: ' + reports.length + ' non-mutating checks.');
  console.log(
    'PENDING: hosted account lifecycle, token rotation, interactive bootstrap, backups and owner signoff.',
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    // Do not echo URLs, tokens, backend response bodies or other sensitive details.
    const text = error instanceof Error ? error.message : 'Unexpected staging preflight error.';
    console.error(
      text.startsWith('STAGING_PREFLIGHT_BLOCKED:')
        ? text
        : 'STAGING_PREFLIGHT_FAILED: network or endpoint check failed.',
    );
    process.exitCode = 1;
  });
}
