import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkHostedStaging, validateHostedConfig } from './staging-preflight.mjs';

const ref = 'qfkjcjzwhewsbblgumco';
const origin = 'https://layarbelajar.pages.dev';
const key = [
  Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),
  Buffer.from('{"iss":"supabase","role":"anon"}').toString('base64url'),
  'signature-placeholder',
].join('.');
const settings = {
  STAGING_SUPABASE_URL: 'https://' + ref + '.supabase.co',
  STAGING_PROJECT_REF: ref,
  STAGING_APP_ORIGIN: origin,
  STAGING_ANON_KEY: key,
};

test('refuses missing project config and local/nonmatching HTTPS destinations', () => {
  assert.throws(() => validateHostedConfig({}), /BLOCKED/);
  for (const url of [
    'http://' + ref + '.supabase.co',
    'https://localhost:54321',
    'https://evil.example',
    'https://' + ref + '.supabase.co/extra',
    'https://' + ref + '.supabase.co?redirect=1',
  ]) {
    assert.throws(
      () => validateHostedConfig({ ...settings, STAGING_SUPABASE_URL: url }),
      /BLOCKED/,
    );
  }
  assert.throws(
    () =>
      validateHostedConfig({
        ...settings,
        STAGING_PROJECT_REF: 'anotherstagingproject',
        STAGING_SUPABASE_URL: 'https://anotherstagingproject.supabase.co',
      }),
    /BLOCKED/,
  );
});
test('missing GitHub staging secret fails closed with actionable and secret-free error', () => {
  assert.throws(
    () => validateHostedConfig({ ...settings, STAGING_ANON_KEY: '' }),
    /GitHub staging Environment secret STAGING_ANON_KEY is missing/,
  );
});
test('refuses service-role JWT and opaque publishable keys', () => {
  assert.throws(
    () => validateHostedConfig({ ...settings, STAGING_ANON_KEY: 'sb_secret_bad' }),
    /BLOCKED/,
  );
  const serviceKey = key.replace(
    Buffer.from('{"iss":"supabase","role":"anon"}').toString('base64url'),
    Buffer.from('{"iss":"supabase","role":"service_role"}').toString('base64url'),
  );
  assert.throws(
    () => validateHostedConfig({ ...settings, STAGING_ANON_KEY: serviceKey }),
    /BLOCKED/,
  );
});
test('refuses non-HTTPS, non-exact browser origins', () => {
  assert.throws(
    () => validateHostedConfig({ ...settings, STAGING_APP_ORIGIN: 'http://localhost:5173' }),
    /BLOCKED/,
  );
  assert.throws(
    () => validateHostedConfig({ ...settings, STAGING_APP_ORIGIN: origin + '/path' }),
    /BLOCKED/,
  );
  assert.throws(
    () => validateHostedConfig({ ...settings, STAGING_APP_ORIGIN: 'https://another.pages.dev' }),
    /BLOCKED/,
  );
});
test('successful probes are GET or OPTIONS only and never include service keys', async () => {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, ...init });
    if (url.includes('/auth/v1/health')) return new Response('{}', { status: 200 });
    if (url.includes('/auth/v1/settings'))
      return Response.json({ disable_signup: true, external: { email: true } });
    if (url.includes('/rest/v1/profiles')) {
      return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const requestOrigin = init.headers.Origin;
    return new Response(null, {
      status: requestOrigin === origin ? 204 : 403,
      headers:
        requestOrigin === origin
          ? {
              'Access-Control-Allow-Origin': origin,
              'Access-Control-Allow-Headers': 'authorization,apikey,content-type',
            }
          : {},
    });
  };
  const result = await checkHostedStaging(validateHostedConfig(settings), fakeFetch);
  assert.equal(result.length, 5);
  assert.equal(calls.length, 7);
  assert.ok(calls.every((call) => ['GET', 'OPTIONS'].includes(call.method)));
  assert.ok(calls.every((call) => call.body === undefined));
});
test('rejects a leaked anonymous profile or permissive foreign CORS', async () => {
  const config = validateHostedConfig(settings);
  const exposed = async (url, init) => {
    if (url.includes('/auth/v1/health')) return new Response('{}', { status: 200 });
    if (url.includes('/auth/v1/settings'))
      return Response.json({ disable_signup: true, external: { email: true } });
    if (url.includes('/rest/v1/profiles'))
      return new Response('[{"id":"leaked"}]', { status: 200 });
    return new Response(null, { status: init.headers.Origin === origin ? 204 : 403 });
  };
  await assert.rejects(() => checkHostedStaging(config, exposed), /exposed profile data/);
  const permissive = async (url, init) => {
    if (url.includes('/auth/v1/health')) return new Response('{}', { status: 200 });
    if (url.includes('/auth/v1/settings'))
      return Response.json({ disable_signup: true, external: { email: true } });
    if (url.includes('/rest/v1/profiles')) return new Response('[]', { status: 200 });
    return new Response(null, {
      status: init.headers.Origin === origin ? 204 : 403,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization,apikey,content-type',
      },
    });
  };
  await assert.rejects(() => checkHostedStaging(config, permissive), /unauthorized Origin/);
});

// A fully read-only settings request must block before any account operation.
test('blocks unsafe Auth settings and unhealthy GoTrue', async () => {
  const config = validateHostedConfig(settings);
  for (const [body, expected] of [
    [{ disable_signup: false, external: { email: true } }, /disable public signup/],
    [{ disable_signup: true, external: { email: false } }, /email login provider/],
    [{ disable_signup: true }, /email login provider/],
  ]) {
    const fetcher = async (url) =>
      url.includes('/auth/v1/health') ? new Response('{}', { status: 200 }) : Response.json(body);
    await assert.rejects(() => checkHostedStaging(config, fetcher), expected);
  }
  await assert.rejects(
    () =>
      checkHostedStaging(config, async (url) =>
        url.includes('/auth/v1/health')
          ? new Response('{}', { status: 200 })
          : new Response('not json', { status: 200 }),
      ),
    /Invalid Auth settings response/,
  );
  await assert.rejects(
    () => checkHostedStaging(config, async () => new Response('{}', { status: 401 })),
    /Auth health check failed/,
  );
});
