import assert from 'node:assert/strict';
import { test } from 'node:test';
import { browserConfig, hostedBrowserQa } from './hosted-browser-auth.mjs';

const jwt = (role) =>
  [
    Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),
    Buffer.from(JSON.stringify({ iss: 'supabase', role })).toString('base64url'),
    'synthetic-signature',
  ].join('.');
const fixture = {
  STAGING_BROWSER_CONFIRM: 'RUN_HOSTED_BROWSER_QA',
  STAGING_PROJECT_REF: 'qfkjcjzwhewsbblgumco',
  STAGING_SUPABASE_URL: 'https://qfkjcjzwhewsbblgumco.supabase.co',
  STAGING_APP_ORIGIN: 'https://layarbelajar.pages.dev',
  STAGING_ANON_KEY: jwt('anon'),
  STAGING_SERVICE_ROLE_KEY: jwt('service_role'),
};

test('browser QA requires explicit approval, pinned origin and a service_role key', () => {
  assert.throws(() => browserConfig({ ...fixture, STAGING_BROWSER_CONFIRM: '' }), /FAILED/);
  assert.throws(
    () => browserConfig({ ...fixture, STAGING_APP_ORIGIN: 'https://wrong.invalid' }),
    /BLOCKED/,
  );
  assert.throws(
    () => browserConfig({ ...fixture, STAGING_SERVICE_ROLE_KEY: jwt('anon') }),
    /BLOCKED/,
  );
  assert.equal(browserConfig(fixture).origin, fixture.STAGING_APP_ORIGIN);
});

test('pre-existing staging identities block before any mutation or Chromium startup', async () => {
  const calls = [];
  const fetcher = async (url, options = {}) => {
    calls.push({ method: options.method, url });
    if (url.endsWith('/auth/v1/health')) return Response.json({}, { status: 200 });
    if (url.endsWith('/auth/v1/settings')) {
      return Response.json({ disable_signup: true, external: { email: true } });
    }
    if (url.includes('/auth/v1/admin/users?')) {
      return Response.json({ users: [{ id: 'existing-user' }] });
    }
    throw Error('Unexpected call');
  };
  const neverBrowser = {
    launch() {
      throw Error('Should never launch browser');
    },
  };
  await assert.rejects(
    () => hostedBrowserQa(fixture, { fetcher, browserType: neverBrowser, log: () => {} }),
    /pre-existing Auth users/,
  );
  assert.deepEqual(
    calls.map((call) => call.method),
    ['GET', 'GET', 'GET'],
  );
});

test('bad public signup policy blocks before fixture creation', async () => {
  const calls = [];
  const fetcher = async (url, options = {}) => {
    calls.push(options.method);
    if (url.endsWith('/auth/v1/health')) return Response.json({});
    return Response.json({ disable_signup: false, external: { email: true } });
  };
  await assert.rejects(
    () => hostedBrowserQa(fixture, { fetcher, log: () => {} }),
    /Auth policy unsafe/,
  );
  assert.deepEqual(calls, ['GET', 'GET']);
});
