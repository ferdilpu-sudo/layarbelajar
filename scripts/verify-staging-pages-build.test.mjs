import assert from 'node:assert/strict';
import { test } from 'node:test';
import { verifyStagingPagesBuild } from './verify-staging-pages-build.mjs';

const ref = 'qfkjcjzwhewsbblgumco';
const payload = (role = 'anon') =>
  Buffer.from(JSON.stringify({ iss: 'supabase', role })).toString('base64url');
const token = (role = 'anon') =>
  [Buffer.from('{"alg":"HS256"}').toString('base64url'), payload(role), 'fake_signature'].join('.');
const env = {
  VITE_SUPABASE_URL: 'https://' + ref + '.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: token(),
  VITE_APP_URL: 'https://example-staging.pages.dev',
};

test('accepts only expected staging HTTPS backend, frontend origin and public anon role', () => {
  assert.deepEqual(verifyStagingPagesBuild(env), {
    backendOrigin: env.VITE_SUPABASE_URL,
    appOrigin: env.VITE_APP_URL,
  });
});

test('refuses cross-project, local, HTTP or backend URLs with extra paths', () => {
  for (const url of [
    'http://' + ref + '.supabase.co',
    'https://another-project.supabase.co',
    'https://localhost:54321',
    env.VITE_SUPABASE_URL + '/auth',
    env.VITE_SUPABASE_URL + '?debug=true',
  ]) {
    assert.throws(
      () => verifyStagingPagesBuild({ ...env, VITE_SUPABASE_URL: url }),
      /STAGING_PAGES_BUILD_BLOCKED/,
    );
  }
});

test('refuses insecure, wildcard, local and path-bearing app origins', () => {
  for (const url of [
    'http://example-staging.pages.dev',
    'https://localhost',
    'https://*.pages.dev',
    'https://example-staging.pages.dev/admin',
    env.VITE_SUPABASE_URL,
    'https://example-staging.pages.dev?next=admin',
  ]) {
    assert.throws(
      () => verifyStagingPagesBuild({ ...env, VITE_APP_URL: url }),
      /STAGING_PAGES_BUILD_BLOCKED/,
    );
  }
});

test('refuses service-role tokens, opaque keys and corrupt JWTs', () => {
  for (const value of [token('service_role'), 'sb_secret_fake', 'sb_publishable_fake', 'not-a-jwt']) {
    assert.throws(
      () => verifyStagingPagesBuild({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: value }),
      /STAGING_PAGES_BUILD_BLOCKED/,
    );
  }
});

test('blocks sensitive VITE-prefixed environment variables', () => {
  for (const name of ['VITE_SUPABASE_SERVICE_ROLE_KEY', 'VITE_DB_PASSWORD', 'VITE_PRIVATE_KEY']) {
    assert.throws(() => verifyStagingPagesBuild({ ...env, [name]: 'unsafe' }), /BLOCKED/);
  }
});

test('does not require Cloudflare credentials or an actual network connection', () => {
  assert.doesNotThrow(() =>
    verifyStagingPagesBuild({ ...env, CF_PAGES: '1', CF_PAGES_BRANCH: 'main' }),
  );
});
