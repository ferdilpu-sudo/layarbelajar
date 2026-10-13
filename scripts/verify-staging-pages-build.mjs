import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STAGING_PROJECT_REF = 'qfkjcjzwhewsbblgumco';
const STAGING_SUPABASE_ORIGIN = 'https://' + STAGING_PROJECT_REF + '.supabase.co';

function block(reason) {
  throw new Error('STAGING_PAGES_BUILD_BLOCKED: ' + reason);
}

function exactHttpsOrigin(input, label) {
  if (typeof input !== 'string' || !input) block(label + ' is missing.');
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    block(label + ' is not a URL.');
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.port ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash ||
    input !== parsed.origin
  ) {
    block(label + ' must be an exact HTTPS origin without a path, query or port.');
  }
  return parsed;
}

export function verifyStagingPagesBuild(env) {
  const backend = exactHttpsOrigin(env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL');
  if (backend.origin !== STAGING_SUPABASE_ORIGIN) {
    block('This build can only target the approved staging Supabase project.');
  }

  const app = exactHttpsOrigin(env.VITE_APP_URL, 'VITE_APP_URL');
  if (
    !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(app.hostname) ||
    app.hostname.endsWith('.supabase.co') ||
    app.hostname === 'localhost' ||
    app.origin === backend.origin
  ) {
    block('The frontend must have its own verified HTTPS hostname.');
  }

  for (const name of Object.keys(env)) {
    if (
      name.startsWith('VITE_') &&
      /(SERVICE_ROLE|SECRET|PRIVATE_KEY|DATABASE_URL|DB_PASSWORD)/i.test(name)
    ) {
      block('Privileged environment variable names cannot use the VITE_ prefix.');
    }
  }

  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (typeof key !== 'string' || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(key)) {
    block('A legacy public anon JWT is required for the current Auth contract.');
  }
  let claims;
  try {
    claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
  } catch {
    block('The public key has an invalid JWT payload.');
  }
  if (claims?.role !== 'anon' || claims?.iss !== 'supabase') {
    block('The public key must have the anon role, never service_role.');
  }
  if (typeof claims.exp === 'number' && claims.exp <= Math.floor(Date.now() / 1000)) {
    block('The public anon JWT has expired.');
  }

  return { backendOrigin: backend.origin, appOrigin: app.origin };
}

export function main(env = process.env) {
  try {
    const result = verifyStagingPagesBuild(env);
    // Never print the public key, the complete environment or a bearer token.
    console.log('STAGING_PAGES_BUILD_PASS: HTTPS origins and anon-key role validated.');
    console.log('STAGING_SITE_ORIGIN: ' + result.appOrigin);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unrecognized build configuration.';
    console.error(
      message.startsWith('STAGING_PAGES_BUILD_BLOCKED:')
        ? message
        : 'STAGING_PAGES_BUILD_BLOCKED: Invalid build configuration.',
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
