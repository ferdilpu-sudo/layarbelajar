import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STAGING_URL = 'https://qfkjcjzwhewsbblgumco.supabase.co';
const EDGE_FUNCTIONS = ['account-admin', 'change-password'];
const FOREIGN_ORIGIN = 'https://untrusted.invalid';

async function request(fetcher, path, method, headers = {}) {
  const response = await fetcher(STAGING_URL + path, {
    method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (response.status >= 300 && response.status < 400) {
    throw new Error('HTTP redirect from staging endpoint: ' + response.status);
  }
  return response;
}

export async function runPublicSmoke(fetcher = fetch) {
  const checks = [];
  const health = await request(fetcher, '/auth/v1/health', 'GET');
  if (![200, 401, 403].includes(health.status)) {
    throw new Error('Auth gateway returned unexpected HTTP ' + health.status);
  }
  checks.push(health.status === 200 ? 'auth-health' : 'auth-gateway-api-key-required');

  for (const name of EDGE_FUNCTIONS) {
    const path = '/functions/v1/' + name;
    const denied = await request(fetcher, path, 'GET');
    if (![401, 403].includes(denied.status)) {
      throw new Error(name + ': unauthenticated GET returned HTTP ' + denied.status);
    }
    checks.push(name + '-anonymous-denied');

    const preflight = await request(fetcher, path, 'OPTIONS', {
      Origin: FOREIGN_ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,apikey,content-type',
    });
    const allow = preflight.headers.get('access-control-allow-origin');
    if (allow === '*' || allow === FOREIGN_ORIGIN) {
      throw new Error(name + ': foreign browser origin unexpectedly allowed.');
    }
    checks.push(name + '-foreign-origin-denied');
  }
  return checks;
}

export async function main() {
  try {
    const checks = await runPublicSmoke();
    for (const check of checks) console.log('PASS hosted-public ' + check);
    console.log('HOSTED_PUBLIC_SMOKE_PASS: ' + checks.length + ' non-mutating requests.');
    console.log(
      'NOT VERIFIED: authorized staging origin, account lifecycle, JWT rotation or RLS user matrix.',
    );
  } catch (error) {
    // Only status/endpoint diagnostics authored here; never log request data or HTTP bodies.
    const message = error instanceof Error ? error.message : 'Network transport failure.';
    console.error('HOSTED_PUBLIC_SMOKE_FAILED: ' + message);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  await main();
}
