import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runStagingBootstrapQa, OWNER_CONFIRMATION } from './staging-bootstrap-qa.mjs';

const uid = '123e4567-e89b-42d3-a456-426614174000';
const jwt = (role) => [
  Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),
  Buffer.from(JSON.stringify({ iss: 'supabase', role })).toString('base64url'),
  'synthetic-signature',
].join('.');
const secrets = { anonKey: jwt('anon'), serviceKey: jwt('service_role') };

function fakeBackend({ existing = false, profileFailure = false } = {}) {
  const state = { users: existing ? [{ id: uid, email: 'someone@accounts.invalid' }] : [], profile: null };
  const calls = [];
  const fetcher = async (url, options) => {
    const { pathname } = new URL(url);
    calls.push(options.method + ' ' + pathname);
    if (pathname === '/auth/v1/health') return Response.json({}, { status: 200 });
    if (pathname === '/auth/v1/settings') {
      return Response.json({ disable_signup: true, external: { email: true } });
    }
    if (pathname === '/auth/v1/admin/users' && options.method === 'GET') {
      return Response.json({ users: state.users });
    }
    if (pathname === '/rest/v1/profiles' && options.method === 'GET') {
      return Response.json(state.profile ? [{ id: uid }] : []);
    }
    if (pathname === '/auth/v1/admin/users' && options.method === 'POST') {
      const user = JSON.parse(options.body);
      state.users = [{ id: uid, email: user.email }];
      return Response.json({ id: uid }, { status: 201 });
    }
    if (pathname === '/rest/v1/profiles' && options.method === 'POST') {
      if (profileFailure) return Response.json({}, { status: 403 });
      state.profile = JSON.parse(options.body);
      return Response.json([state.profile], { status: 201 });
    }
    if (pathname === '/auth/v1/token' && options.method === 'POST') {
      return Response.json({ access_token: 'fixture-session' });
    }
    if (pathname === '/rest/v1/profiles' && options.method === 'GET') {
      return Response.json(state.profile ? [{ id: uid }] : []);
    }
    if (pathname === '/rest/v1/profiles' && options.method !== 'GET') {
      return Response.json({}, { status: 403 });
    }
    if (pathname === '/auth/v1/admin/users/' + uid && options.method === 'DELETE') {
      state.users = [];
      state.profile = null;
      return new Response(null, { status: 204 });
    }
    if (pathname === '/rest/v1/profiles' && options.method === 'PATCH') {
      return Response.json({}, { status: 403 });
    }
    if (pathname === '/rest/v1/profiles' && options.method === 'GET') {
      return Response.json(state.profile ? [state.profile] : []);
    }
    if (url.includes('/rest/v1/profiles?select=id,role,active,must_change_password')) {
      return Response.json(state.profile ? [state.profile] : []);
    }
    return Response.json({ error: 'fixture unexpected' }, { status: 500 });
  };
  return { state, calls, fetcher };
}

test('preexisting users fail closed before asking for a password or writing', async () => {
  const ctx = fakeBackend({ existing: true });
  let prompted = false;
  await assert.rejects(
    () => runStagingBootstrapQa({
      ...secrets,
      fetcher: ctx.fetcher,
      getPassword: () => { prompted = true; return 'longpasswordAa2!'; },
      getConfirmation: () => OWNER_CONFIRMATION,
      log: () => {},
    }),
    /Nonempty Auth users/,
  );
  assert.equal(prompted, false);
  assert.ok(ctx.calls.every((value) => value.startsWith('GET ')));
});

test('wrong confirmation blocks all mutation', async () => {
  const ctx = fakeBackend();
  await assert.rejects(
    () => runStagingBootstrapQa({
      ...secrets,
      fetcher: ctx.fetcher,
      getPassword: () => 'longpasswordAa2!',
      getConfirmation: () => 'wrong',
      log: () => {},
    }),
    /Owner confirmation missing/,
  );
  assert.ok(ctx.calls.every((value) => value.startsWith('GET ')));
});

test('rejects wrong service-role JWT before network access', async () => {
  let connected = false;
  await assert.rejects(
    () => runStagingBootstrapQa({
      ...secrets,
      serviceKey: jwt('anon'),
      fetcher: () => { connected = true; },
    }),
    /service_role/,
  );
  assert.equal(connected, false);
});

test('failed profile creation cleans only test identity', async () => {
  const ctx = fakeBackend({ profileFailure: true });
  await assert.rejects(
    () => runStagingBootstrapQa({
      ...secrets,
      fetcher: ctx.fetcher,
      getPassword: () => 'longpasswordAa2!',
      getConfirmation: () => OWNER_CONFIRMATION,
      log: () => {},
    }),
    /WINDOWS_BOOTSTRAP_FAILED/,
  );
  assert.equal(ctx.state.users.length, 0);
  assert.equal(ctx.state.profile, null);
  assert.equal(ctx.calls.filter((x) => x.startsWith('DELETE ')).length, 1);
});
