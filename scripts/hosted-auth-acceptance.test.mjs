import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runHostedAcceptance, validateConfig } from './hosted-auth-acceptance.mjs';

const jwt = (role) =>
  [
    Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),
    Buffer.from(JSON.stringify({ iss: 'supabase', role })).toString('base64url'),
    'synthetic-signature',
  ].join('.');
const env = {
  STAGING_ACCEPTANCE_CONFIRM: 'RUN_SYNTHETIC_STAGING_ONLY',
  STAGING_PROJECT_REF: 'qfkjcjzwhewsbblgumco',
  STAGING_SUPABASE_URL: 'https://qfkjcjzwhewsbblgumco.supabase.co',
  STAGING_APP_ORIGIN: 'https://layarbelajar.pages.dev',
  STAGING_ANON_KEY: jwt('anon'),
  STAGING_SERVICE_ROLE_KEY: jwt('service_role'),
};

test('rejects missing approval, missing service-role secret and wrong project', () => {
  assert.throws(() => validateConfig({ ...env, STAGING_ACCEPTANCE_CONFIRM: '' }), /BLOCKED/);
  assert.throws(() => validateConfig({ ...env, STAGING_SERVICE_ROLE_KEY: '' }), /BLOCKED/);
  assert.throws(() => validateConfig({ ...env, STAGING_SERVICE_ROLE_KEY: jwt('anon') }), /BLOCKED/);
  assert.throws(
    () => validateConfig({ ...env, STAGING_SUPABASE_URL: 'https://different.supabase.co' }),
    /BLOCKED/,
  );
  assert.throws(
    () => validateConfig({ ...env, STAGING_APP_ORIGIN: 'https://foreign.invalid' }),
    /BLOCKED/,
  );
  assert.equal(validateConfig(env).url, env.STAGING_SUPABASE_URL);
});

test('refuses staging with any pre-existing Auth user before any mutation', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url, method: options.method });
    if (url.endsWith('/auth/v1/health')) return Response.json({}, { status: 200 });
    if (url.endsWith('/auth/v1/settings')) {
      return Response.json({ disable_signup: true, external: { email: true } });
    }
    if (url.includes('/auth/v1/admin/users?')) {
      return Response.json({ users: [{ id: 'existing-account' }] });
    }
    return Response.json([], { status: 200 });
  };
  await assert.rejects(
    () => runHostedAcceptance(env, fakeFetch, () => {}),
    /Staging Auth is not empty/,
  );
  assert.ok(calls.length >= 3);
  assert.ok(calls.every((call) => call.method === 'GET'));
});

test('refuses unsafe signup policy before any mutation', async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push(options.method);
    if (url.endsWith('/auth/v1/health')) return Response.json({}, { status: 200 });
    return Response.json({ disable_signup: false, external: { email: true } });
  };
  await assert.rejects(() => runHostedAcceptance(env, fakeFetch, () => {}), /Signup policy/);
  assert.deepEqual(calls, ['GET', 'GET']);
});
