import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runPublicSmoke, STAGING_URL, APPROVED_ORIGIN } from './staging-public-smoke.mjs';

test('public smoke reads only a pinned staging URL using GET and OPTIONS', async () => {
  const calls = [];
  const mockFetch = async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/auth/v1/health')) return new Response('{}', { status: 200 });
    if (init.method === 'GET') return new Response('{}', { status: 401 });
    if (init.headers.Origin === APPROVED_ORIGIN) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': APPROVED_ORIGIN,
          'Access-Control-Allow-Headers': 'authorization,apikey,content-type',
        },
      });
    }
    return new Response(null, { status: 403 });
  };
  const result = await runPublicSmoke(mockFetch);
  assert.equal(result.length, 7);
  assert.equal(calls.length, 7);
  assert.ok(calls.every((call) => call.url.startsWith(STAGING_URL + '/')));
  assert.ok(calls.every((call) => ['GET', 'OPTIONS'].includes(call.init.method)));
  assert.ok(calls.every((call) => call.init.body === undefined));
  assert.ok(calls.every((call) => call.init.headers.Authorization === undefined));
});

test('fails if hosted functions allow no-token callers', async () => {
  const mockFetch = async (url) =>
    new Response('{}', { status: url.endsWith('/health') ? 200 : 200 });
  await assert.rejects(() => runPublicSmoke(mockFetch), /unauthenticated GET returned HTTP/);
});

test('fails when foreign-origin wildcard CORS is returned', async () => {
  const mockFetch = async (url, init) => {
    if (url.endsWith('/health')) return new Response('{}', { status: 200 });
    if (init.method === 'GET') return new Response('{}', { status: 401 });
    return new Response(null, {
      status: init.headers.Origin === APPROVED_ORIGIN ? 204 : 403,
      headers: {
        'Access-Control-Allow-Origin':
          init.headers.Origin === APPROVED_ORIGIN ? APPROVED_ORIGIN : '*',
        'Access-Control-Allow-Headers': 'authorization,apikey,content-type',
      },
    });
  };
  await assert.rejects(() => runPublicSmoke(mockFetch), /foreign browser origin/);
});

test('fails closed when an approved staging origin is not configured on the hosted Edge', async () => {
  const fakeFetch = async (url, init) => {
    if (url.endsWith('/health')) return new Response('{}', { status: 401 });
    if (init.method === 'GET') return new Response('{}', { status: 401 });
    return new Response(null, { status: 403 });
  };
  await assert.rejects(() => runPublicSmoke(fakeFetch), /approved-origin OPTIONS HTTP/);
});

test('fails closed when a CORS response does not permit the authorization header', async () => {
  const fakeFetch = async (url, init) => {
    if (url.endsWith('/health')) return new Response('{}', { status: 401 });
    if (init.method === 'GET') return new Response('{}', { status: 401 });
    if (init.headers.Origin === APPROVED_ORIGIN) {
      return new Response(null, {
        status: 204,
        headers: { 'Access-Control-Allow-Origin': APPROVED_ORIGIN },
      });
    }
    return new Response(null, { status: 403 });
  };
  await assert.rejects(() => runPublicSmoke(fakeFetch), /authorization header missing/);
});
