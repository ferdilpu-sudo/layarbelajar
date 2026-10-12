import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { localSupabaseEnv, localRequest } from '../../scripts/local-supabase-env.mjs';

const suiteId = randomBytes(5).toString('hex');
const password = randomBytes(24).toString('base64url') + 'Ab1!';
const local = localSupabaseEnv();
const createdUsers = [];

function sampleUsername(prefix) {
  return ('lb_' + prefix + '_' + suiteId).slice(0, 32);
}

async function createUser(
  username,
  { role = 'student', pending = false, createProfile = true } = {},
) {
  const alias = username + '@accounts.invalid';
  const created = await localRequest(local.url, local.serviceKey, '/auth/v1/admin/users', {
    method: 'POST',
    body: { email: alias, password, email_confirm: true },
  });
  assert.equal(created.ok, true, 'GoTrue must accept synthetic .invalid alias in local test');
  const id = created.data?.id;
  assert.ok(typeof id === 'string', 'Auth user ID must be returned');
  createdUsers.push(id);
  if (createProfile) {
    const profile = await localRequest(local.url, local.serviceKey, '/rest/v1/profiles', {
      method: 'POST',
      body: {
        id,
        username,
        display_name: 'Data Uji',
        role,
        active: true,
        must_change_password: pending,
      },
    });
    assert.equal(profile.ok, true, 'Trusted profile provisioning must succeed');
  }
  const session = await localRequest(
    local.url,
    local.anonKey,
    '/auth/v1/token?grant_type=password',
    { method: 'POST', body: { email: alias, password } },
  );
  assert.equal(
    session.ok,
    true,
    'Username alias/password login failed: HTTP ' +
      session.status +
      ', code=' +
      String(session.data?.code ?? session.data?.error_code ?? 'unknown'),
  );
  assert.ok(session.data?.access_token, 'Expected Auth access token');
  return { id, accessToken: session.data.access_token, alias };
}

async function ownRows(token) {
  const response = await localRequest(
    local.url,
    local.anonKey,
    '/rest/v1/profiles?select=id,username,role,active,must_change_password',
    { token },
  );
  assert.equal(response.status, 200, 'Own SELECT must be allowed at table privilege layer');
  return response.data;
}

async function updatePrivileged(id, changes) {
  const result = await localRequest(
    local.url,
    local.serviceKey,
    '/rest/v1/profiles?id=eq.' + encodeURIComponent(id),
    {
      method: 'PATCH',
      body: changes,
    },
  );
  assert.equal(result.ok, true, 'Only the trusted service can change account flags');
}

test('TASK-006 local Auth alias spike + profile access and deny-by-default RLS', async (t) => {
  t.after(async () => {
    for (const id of createdUsers.reverse()) {
      const removed = await localRequest(
        local.url,
        local.serviceKey,
        '/auth/v1/admin/users/' + id,
        { method: 'DELETE' },
      );
      assert.equal(removed.ok, true, 'Synthetic Auth cleanup must succeed');
    }
  });
  await t.test('open registration disabled (admin creates users only)', async () => {
    const signup = await localRequest(local.url, local.anonKey, '/auth/v1/signup', {
      method: 'POST',
      body: { email: sampleUsername('signup') + '@accounts.invalid', password },
    });
    assert.equal(signup.ok, false, 'Anonymous self-signup must be disabled');
  });

  const student = await createUser(sampleUsername('student'));
  const other = await createUser(sampleUsername('teacher'), { role: 'teacher', pending: true });
  const orphan = await createUser(sampleUsername('orphan'), { createProfile: false });

  await t.test('username alias is accepted and a ready student sees own row only', async () => {
    assert.ok(student.alias.endsWith('@accounts.invalid'));
    assert.deepEqual(
      (await ownRows(student.accessToken)).map((x) => x.id),
      [student.id],
    );
  });

  await t.test(
    'temporary password flag blocks profile access until trusted server clears it',
    async () => {
      assert.deepEqual(await ownRows(other.accessToken), []);
      await updatePrivileged(other.id, { must_change_password: false });
      assert.deepEqual(
        (await ownRows(other.accessToken)).map((x) => x.id),
        [other.id],
      );
    },
  );

  await t.test('other profile inaccessible despite searching explicit foreign ID', async () => {
    const response = await localRequest(
      local.url,
      local.anonKey,
      '/rest/v1/profiles?id=eq.' + other.id + '&select=id,role',
      { token: student.accessToken },
    );
    assert.equal(response.status, 200);
    assert.deepEqual(response.data, []);
  });

  await t.test(
    'browser token cannot change role/active/password flag or insert/delete rows',
    async () => {
      const patched = await localRequest(
        local.url,
        local.anonKey,
        '/rest/v1/profiles?id=eq.' + student.id,
        {
          method: 'PATCH',
          token: student.accessToken,
          body: { role: 'admin', active: true, must_change_password: false },
        },
      );
      assert.ok(!patched.ok, 'PATCH must fail');
      const inserted = await localRequest(local.url, local.anonKey, '/rest/v1/profiles', {
        method: 'POST',
        token: student.accessToken,
        body: {
          id: student.id,
          username: 'evil_user',
          display_name: 'Privilege escalation',
          role: 'admin',
        },
      });
      assert.ok(!inserted.ok, 'INSERT must fail');
      const deleted = await localRequest(
        local.url,
        local.anonKey,
        '/rest/v1/profiles?id=eq.' + student.id,
        {
          method: 'DELETE',
          token: student.accessToken,
        },
      );
      assert.ok(!deleted.ok, 'DELETE must fail');
      const result = await ownRows(student.accessToken);
      assert.equal(result[0].role, 'student');
    },
  );

  await t.test('no profile for an orphan Auth account yields no privileged data', async () => {
    assert.deepEqual(await ownRows(orphan.accessToken), []);
  });

  await t.test('deactivation blocks existing JWT immediately at database boundary', async () => {
    await updatePrivileged(student.id, { active: false });
    assert.deepEqual(await ownRows(student.accessToken), []);
  });

  await t.test('anon bearer cannot read profiles', async () => {
    const response = await localRequest(local.url, local.anonKey, '/rest/v1/profiles?select=id');
    assert.ok(!response.ok || (Array.isArray(response.data) && response.data.length === 0));
  });
});
