import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runPublicSmoke, STAGING_URL } from './staging-public-smoke.mjs';

test('public smoke reads only a pinned staging URL using GET and OPTIONS', async () => {
  const calls = [];
  const mockFetch = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/auth/v1/health')) return new Response('{}', { status: 200 });
    if (init.method === 'GET') return new Response('{}', { status: 401 });
    return new Response(null, { status: 403 });
  };
  const result = await runPublicSmoke(mockFetch);
  assert.equal(result.length, 5);
  assert.equal(calls.length, 5);
  assert.ok(calls.every((call) => call.url.startsWith(STAGING_URL + '/')));
  assert.ok(calls.every((call) => ['GET', 'OPTIONS'].includes(call.init.method)));
  assert.ok(calls.every((call) => call.init.body === undefined));
  assert.ok(calls.every((call) => call.init.headers.Authorization === undefined));
});

test('fails if hosted functions allow no-token callers', async () => {
  const mockFetch = async (url) =>
    new Response('{}', { status: url.endsWith('/health') ? 200 : 200 });
  await assert.rejects(() => runPublicSmoke(mockFetch), /anonymous authorization denial/);
});

test('fails when foreign-origin wildcard CORS is returned', async () => {
  const mockFetch = async (url, init) => {
    if (url.endsWith('/health')) return new Response('{}', { status: 200 });
    if (init.method === 'GET') return new Response('{}', { status: 401 });
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  };
  await assert.rejects(() => runPublicSmoke(mockFetch), /foreign browser origin/);
});
