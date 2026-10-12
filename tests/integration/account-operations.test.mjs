import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { localSupabaseEnv, localRequest } from '../../scripts/local-supabase-env.mjs';

const env = localSupabaseEnv();
const suffix = randomBytes(5).toString('hex');
const strongPassword = randomBytes(20).toString('base64url') + 'Aa12!';
const rotatedPassword = randomBytes(20).toString('base64url') + 'Zz34!';
const createdIds = [];
const username = (role) => 'lb_' + role + '_' + suffix;

async function adminUser(role, pending = false) {
  const name = username(role);
  const created = await localRequest(env.url, env.serviceKey, '/auth/v1/admin/users', {
    method: 'POST',
    body: { email: name + '@accounts.invalid', password: strongPassword, email_confirm: true },
  });
  assert.equal(created.ok, true, 'Test Auth fixture created');
  const id = created.data?.id;
  assert.ok(id);
  createdIds.push(id);
  const profile = await localRequest(env.url, env.serviceKey, '/rest/v1/profiles', {
    method: 'POST',
    body: {
      id,
      username: name,
      display_name: 'Test Actor',
      role,
      must_change_password: pending,
      active: true,
    },
  });
  assert.equal(profile.ok, true);
  const login = await localRequest(env.url, env.anonKey, '/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email: name + '@accounts.invalid', password: strongPassword },
  });
  assert.equal(login.ok, true);
  return { id, token: login.data?.access_token };
}
function edge(name, token, body, method) {
  return localRequest(env.url, env.anonKey, '/functions/v1/' + name, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    token,
    body,
  });
}
async function waitForEdge() {
  for (let i = 0; i < 50; i++) {
    try {
      const response = await edge('change-password', env.anonKey);
      if (response.status === 401 || response.status === 403) return;
    } catch {
      /* Edge runtime still starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Local Edge Functions not reachable');
}

test('TASK-007 local protected account operations (real Auth + Edge + RLS)', async (t) => {
  t.after(async () => {
    for (const id of createdIds.reverse()) {
      const removed = await localRequest(env.url, env.serviceKey, '/auth/v1/admin/users/' + id, {
        method: 'DELETE',
      });
      assert.equal(removed.ok, true, 'Fixture cleanup');
    }
  });
  await waitForEdge();
  const admin = await adminUser('admin');
  const student = await adminUser('student');

  await t.test('unauthenticated or student cannot call admin provisioning', async () => {
    const payload = {
      action: 'provision',
      username: username('forbidden'),
      display_name: 'Forbidden',
      role: 'student',
    };
    const anonymous = await edge('account-admin', env.anonKey, payload);
    assert.equal(anonymous.ok, false);
    const blocked = await edge('account-admin', student.token, payload);
    assert.equal(blocked.status, 403);
  });

  let teacher;
  await t.test('admin provision teacher with one-time password; duplicate rejected', async () => {
    const provision = {
      action: 'provision',
      username: username('teacher'),
      display_name: 'Contoh Guru',
      role: 'teacher',
    };
    const response = await edge('account-admin', admin.token, provision);
    assert.equal(
      response.status,
      200,
      'Admin Edge provision status=' + response.status + ' code=' + response.data?.error?.code,
    );
    const data = response.data?.data;
    assert.equal(data?.role, 'teacher');
    assert.equal(typeof data?.temporary_password, 'string');
    assert.ok(data.temporary_password.length >= 12);
    teacher = { id: data.id, password: data.temporary_password };
    createdIds.push(teacher.id);
    const duplicated = await edge('account-admin', admin.token, provision);
    assert.equal(duplicated.status, 409);
    const login = await localRequest(env.url, env.anonKey, '/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email: username('teacher') + '@accounts.invalid', password: teacher.password },
    });
    assert.equal(login.ok, true, 'New teacher can sign in with alias');
    teacher.token = login.data?.access_token;
  });

  await t.test('only admin may list teacher/student accounts', async () => {
    const forbidden = await edge('account-admin', student.token, { action: 'list' });
    assert.equal(forbidden.status, 403);
    const listed = await edge('account-admin', admin.token, { action: 'list' });
    assert.equal(listed.status, 200);
    const teacherRecord = listed.data?.data?.items?.find((item) => item.id === teacher.id);
    assert.equal(teacherRecord?.username, username('teacher'));
    assert.equal(teacherRecord?.role, 'teacher');
    assert.ok(!JSON.stringify(teacherRecord).includes('temporary_password'));
  });

  await t.test(
    'pending teacher cannot access data but may inspect own password requirement',
    async () => {
      const profile = await localRequest(env.url, env.anonKey, '/rest/v1/profiles?select=id', {
        token: teacher.token,
      });
      assert.deepEqual(profile.data, []);
      const status = await edge('change-password', teacher.token);
      assert.equal(status.status, 200);
      assert.equal(status.data?.data?.must_change_password, true);
      assert.equal(status.data?.data?.role, null);
    },
  );

  await t.test(
    'password change rejects wrong old and then clears pending only on success',
    async () => {
      const blocked = await edge('change-password', teacher.token, {
        old_password: 'BadOldPassword123',
        new_password: rotatedPassword,
      });
      assert.equal(blocked.status, 403);
      const stillLocked = await localRequest(env.url, env.anonKey, '/rest/v1/profiles?select=id', {
        token: teacher.token,
      });
      assert.deepEqual(stillLocked.data, []);
      const changed = await edge('change-password', teacher.token, {
        old_password: teacher.password,
        new_password: rotatedPassword,
      });
      assert.equal(changed.status, 200, 'Change password must succeed before unblocking RLS');
      const reauth = await localRequest(
        env.url,
        env.anonKey,
        '/auth/v1/token?grant_type=password',
        {
          method: 'POST',
          body: { email: username('teacher') + '@accounts.invalid', password: rotatedPassword },
        },
      );
      assert.equal(reauth.ok, true, 'After changing password, new credentials must work');
      teacher.token = reauth.data?.access_token;
      const ready = await edge('change-password', teacher.token);
      assert.equal(ready.status, 200);
      assert.equal(ready.data?.data?.must_change_password, false);
      assert.equal(ready.data?.data?.role, 'teacher');
    },
  );

  await t.test('student cannot reset or deactivate others; admin can reset teacher', async () => {
    const denied = await edge('account-admin', student.token, {
      action: 'reset-password',
      user_id: teacher.id,
    });
    assert.equal(denied.status, 403);
    const reset = await edge('account-admin', admin.token, {
      action: 'reset-password',
      user_id: teacher.id,
    });
    assert.equal(reset.status, 200);
    assert.ok(reset.data?.data?.temporary_password);
    const disabled = await localRequest(env.url, env.anonKey, '/rest/v1/profiles?select=id', {
      token: teacher.token,
    });
    assert.deepEqual(disabled.data, [], 'Old JWT must no longer read profile after reset');
    const login = await localRequest(env.url, env.anonKey, '/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: {
        email: username('teacher') + '@accounts.invalid',
        password: reset.data.data.temporary_password,
      },
    });
    assert.equal(login.ok, true);
    teacher.token = login.data?.access_token;
  });

  await t.test('deactivation blocks existing JWT, including own status endpoint', async () => {
    const deactivated = await edge('account-admin', admin.token, {
      action: 'deactivate',
      user_id: teacher.id,
    });
    assert.equal(deactivated.status, 200);
    const status = await edge('change-password', teacher.token);
    assert.equal(status.status, 403);
    const profile = await localRequest(env.url, env.anonKey, '/rest/v1/profiles?select=id', {
      token: teacher.token,
    });
    assert.deepEqual(profile.data, []);
  });

  await t.test('admin cannot deactivate admin or provision a new admin', async () => {
    const badRole = await edge('account-admin', admin.token, {
      action: 'provision',
      username: username('badrole'),
      display_name: 'No',
      role: 'admin',
    });
    assert.equal(badRole.status, 400);
    const self = await edge('account-admin', admin.token, {
      action: 'deactivate',
      user_id: admin.id,
    });
    assert.equal(self.status, 403);
  });
});
