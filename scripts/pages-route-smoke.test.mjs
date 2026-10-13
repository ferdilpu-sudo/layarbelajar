import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { checkPages } from './pages-route-smoke.mjs';

const html =
  '<html><head><title>LayarBelajar</title>' +
  '<script src="/assets/test.js"></script></head><body><div id="root"></div></body></html>';

test('native SPA fallback has no redirect loop or explicit root 404 override', () => {
  assert.equal(existsSync(new URL('../public/_redirects', import.meta.url)), false);
  assert.equal(existsSync(new URL('../public/404.html', import.meta.url)), false);
});

test('GET-only smoke checks deep routes and referenced asset', async () => {
  const methods = [];
  const mock = async (url, options) => {
    methods.push(options.method);
    return new Response(
      url.endsWith('.js') ? 'export const example = "' + 'x'.repeat(140) + '";' : html,
      { status: 200, headers: { 'content-type': url.endsWith('.js') ? 'text/javascript' : 'text/html' } },
    );
  };
  assert.equal((await checkPages(mock)).length, 5);
  assert.deepEqual(methods, ['GET', 'GET', 'GET', 'GET', 'GET']);
});

test('rejects a missing direct deep link', async () => {
  const mock = async (url) =>
    new Response(html, {
      status: url.endsWith('/admin/akun') ? 404 : 200,
      headers: { 'content-type': 'text/html' },
    });
  await assert.rejects(() => checkPages(mock), /admin\/akun returned HTTP 404/);
});
