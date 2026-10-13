import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REF = 'qfkjcjzwhewsbblgumco';
const URL = 'https://' + REF + '.supabase.co';
const ORIGIN = 'https://layarbelajar.pages.dev';
const CONFIRMATION = 'RUN_SYNTHETIC_STAGING_ONLY';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function block(message) {
  throw new Error('HOSTED_ACCEPTANCE_BLOCKED: ' + message);
}

function roleOf(jwt) {
  if (typeof jwt !== 'string' || jwt.split('.').length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'));
    if (
      payload.iss !== 'supabase' ||
      (typeof payload.exp === 'number' && payload.exp <= Date.now() / 1000)
    ) return null;
    return payload.role;
  } catch {
    return null;
  }
}

export function validateConfig(env) {
  if (env.STAGING_ACCEPTANCE_CONFIRM !== CONFIRMATION) block('Explicit staging-only confirmation is required.');
  if (env.STAGING_PROJECT_REF !== REF || env.STAGING_SUPABASE_URL !== URL || env.STAGING_APP_ORIGIN !== ORIGIN) {
    block('The target must be the exact dedicated staging project and Pages origin.');
  }
  if (roleOf(env.STAGING_ANON_KEY) !== 'anon') block('GitHub staging Environment secret STAGING_ANON_KEY must be a legacy anon JWT.');
  if (roleOf(env.STAGING_SERVICE_ROLE_KEY) !== 'service_role') {
    block('GitHub staging Environment secret STAGING_SERVICE_ROLE_KEY must be a legacy service_role JWT.');
  }
  if (env.STAGING_ANON_KEY === env.STAGING_SERVICE_ROLE_KEY) block('Public and service keys must differ.');
  return { url: URL, origin: ORIGIN, anon: env.STAGING_ANON_KEY, service: env.STAGING_SERVICE_ROLE_KEY };
}

function requireResult(condition, step) {
  if (!condition) throw new Error('HOSTED_ACCEPTANCE_FAILED: ' + step);
}

async function request(cfg, fetcher, path, { service = false, method = 'GET', token, body, origin = false } = {}) {
  const key = service ? cfg.service : cfg.anon;
  let response;
  try {
    response = await fetcher(cfg.url + path, {
      method,
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + (token ?? key),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(origin ? { Origin: cfg.origin } : {}),
        ...(path.startsWith('/rest/') && method === 'POST'
          ? { Prefer: 'return=representation' }
          : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error('HOSTED_ACCEPTANCE_FAILED: Network request failed; check staging endpoint.');
  }
  requireResult(response.status < 300 || response.status >= 400, 'Unexpected redirect.');
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Empty or deliberately opaque errors are never printed.
  }
  return { status: response.status, ok: response.ok, data };
}

function generatedPassword() {
  return randomBytes(24).toString('base64url') + 'Aa9!';
}

function newIdentity(suffix, role) {
  const username = 'lbqa_' + suffix + '_' + role;
  return { username, email: username + '@accounts.invalid' };
}

export async function runHostedAcceptance(env, fetcher = fetch, log = console.log) {
  const cfg = validateConfig(env);
  const suffix = randomBytes(5).toString('hex');
  const names = ['admin', 'teacher', 'student'].map((role) => newIdentity(suffix, role));
  const createdIds = new Set();
  let startedMutation = false;
  let completed = false;
  let firstError;

  const api = (path, options) => request(cfg, fetcher, path, options);
  const edge = (name, token, body, method = 'POST') =>
    api('/functions/v1/' + name, { token, method, body, origin: true });
  const login = async (identity, password) => {
    const result = await api('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email: identity.email, password },
    });
    requireResult(result.ok && typeof result.data?.access_token === 'string', 'Synthetic sign-in failed.');
    return result.data;
  };
  const ownRows = async (token, id) => {
    const r = await api('/rest/v1/profiles?select=id,username,role,active,must_change_password', { token });
    requireResult(r.ok && Array.isArray(r.data), 'Authenticated profile query failed.');
    if (id) requireResult(r.data.length === 1 && r.data[0].id === id, 'Own-profile RLS mismatch.');
    return r.data;
  };
  const listUsers = async () => {
    const r = await api('/auth/v1/admin/users?per_page=10&page=1', { service: true });
    requireResult(r.ok && Array.isArray(r.data?.users), 'Admin list-users precheck failed.');
    return r.data.users;
  };
  const profiles = async () => {
    const r = await api('/rest/v1/profiles?select=id&limit=10', { service: true });
    requireResult(r.ok && Array.isArray(r.data), 'Trusted profile count check failed.');
    return r.data;
  };
  const provision = async (adminToken, identity, role) => {
    const r = await edge('account-admin', adminToken, {
      action: 'provision',
      username: identity.username,
      display_name: 'Uji Sintetis ' + role,
      role,
    });
    requireResult(
      r.status === 200 && uuid.test(r.data?.data?.id ?? '') &&
        typeof r.data?.data?.temporary_password === 'string',
      'Admin provision ' + role + ' failed.',
    );
    createdIds.add(r.data.data.id);
    return { id: r.data.data.id, password: r.data.data.temporary_password };
  };

  // All preconditions are read-only, performed before creating ANY identity.
  const health = await api('/auth/v1/health');
  requireResult(health.status === 200, 'Hosted GoTrue health precheck failed.');
  const policy = await api('/auth/v1/settings');
  requireResult(
    policy.status === 200 &&
      policy.data?.disable_signup === true &&
      policy.data?.external?.email === true,
    'Signup policy precheck failed.',
  );
  requireResult((await listUsers()).length === 0, 'Staging Auth is not empty; no accounts were touched.');
  requireResult((await profiles()).length === 0, 'Staging profiles not empty; no accounts were touched.');
  log('PASS hosted-acceptance preflight-empty-staging');

  try {
    startedMutation = true;
    const password = generatedPassword();
    const auth = await api('/auth/v1/admin/users', {
      service: true,
      method: 'POST',
      body: { email: names[0].email, password, email_confirm: true },
    });
    requireResult(auth.ok && uuid.test(auth.data?.id ?? ''), 'Synthetic admin Auth creation failed.');
    const adminId = auth.data.id;
    createdIds.add(adminId);
    const profile = await api('/rest/v1/profiles', {
      service: true,
      method: 'POST',
      body: {
        id: adminId,
        username: names[0].username,
        display_name: 'Admin Uji Sintetis',
        role: 'admin',
        active: true,
        must_change_password: false,
      },
    });
    requireResult(profile.ok, 'Synthetic admin profile creation failed.');
    const admin = await login(names[0], password);
    await ownRows(admin.access_token, adminId);
    log('PASS hosted-acceptance admin-bootstrap-login');

    const teacher = await provision(admin.access_token, names[1], 'teacher');
    const student = await provision(admin.access_token, names[2], 'student');
    requireResult(createdIds.size === 3, 'Unexpected synthetic identity count.');
    const teacherInitial = await login(names[1], teacher.password);
    const studentInitial = await login(names[2], student.password);
    requireResult((await ownRows(teacherInitial.access_token)).length === 0, 'Pending teacher gained profile access.');
    requireResult((await ownRows(studentInitial.access_token)).length === 0, 'Pending student gained profile access.');
    const pendingTeacher = await edge('change-password', teacherInitial.access_token, undefined, 'GET');
    requireResult(pendingTeacher.status === 200 && pendingTeacher.data?.data?.must_change_password === true, 'Pending teacher status failed.');
    const denied = await edge('account-admin', studentInitial.access_token, { action: 'list' });
    requireResult(denied.status === 403, 'Student gained admin privileges.');
    log('PASS hosted-acceptance provision-pending-deny-role');

    const teacherNewPassword = generatedPassword();
    const badPassword = await edge('change-password', teacherInitial.access_token, {
      old_password: generatedPassword(),
      new_password: teacherNewPassword,
    });
    requireResult(badPassword.status === 403, 'Wrong password unexpectedly accepted.');
    const changed = await edge('change-password', teacherInitial.access_token, {
      old_password: teacher.password,
      new_password: teacherNewPassword,
    });
    requireResult(changed.status === 200, 'Teacher password change failed.');
    const teacherReady = await login(names[1], teacherNewPassword);
    await ownRows(teacherReady.access_token, teacher.id);
    const foreign = await api('/rest/v1/profiles?select=id&id=eq.' + encodeURIComponent(student.id), {
      token: teacherReady.access_token,
    });
    requireResult(foreign.ok && Array.isArray(foreign.data) && foreign.data.length === 0, 'Cross-role RLS leak.');
    log('PASS hosted-acceptance password-change-cross-role-rls');

    const studentNewPassword = generatedPassword();
    const changedStudent = await edge('change-password', studentInitial.access_token, {
      old_password: student.password,
      new_password: studentNewPassword,
    });
    requireResult(changedStudent.status === 200, 'Student password change failed.');
    const studentReady = await login(names[2], studentNewPassword);
    await ownRows(studentReady.access_token, student.id);
    const escalation = await api('/rest/v1/profiles?id=eq.' + student.id, {
      token: studentReady.access_token,
      method: 'PATCH',
      body: { role: 'admin' },
    });
    requireResult(!escalation.ok, 'Authenticated profile escalation unexpectedly allowed.');
    log('PASS hosted-acceptance student-own-profile-write-denial');

    requireResult(typeof teacherReady.refresh_token === 'string', 'Refresh token absent.');
    const refreshed = await api('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: teacherReady.refresh_token },
    });
    requireResult(
      refreshed.ok && typeof refreshed.data?.access_token === 'string' &&
        typeof refreshed.data?.refresh_token === 'string' &&
        refreshed.data.refresh_token !== teacherReady.refresh_token,
      'Refresh token rotation failed.',
    );
    await ownRows(refreshed.data.access_token, teacher.id);
    log('PASS hosted-acceptance refresh-token-rotation');

    const reset = await edge('account-admin', admin.access_token, {
      action: 'reset-password',
      user_id: teacher.id,
    });
    requireResult(
      reset.status === 200 && typeof reset.data?.data?.temporary_password === 'string',
      'Admin password reset failed.',
    );
    requireResult((await ownRows(refreshed.data.access_token)).length === 0, 'Reset did not block old JWT.');
    const resetLogin = await login(names[1], reset.data.data.temporary_password);
    const resetPending = await edge('change-password', resetLogin.access_token, undefined, 'GET');
    requireResult(resetPending.status === 200 && resetPending.data?.data?.must_change_password === true, 'Reset pending flag absent.');
    const stopped = await edge('account-admin', admin.access_token, {
      action: 'deactivate',
      user_id: teacher.id,
    });
    requireResult(stopped.status === 200, 'Admin deactivate failed.');
    const deniedInactive = await edge('change-password', resetLogin.access_token, undefined, 'GET');
    requireResult(deniedInactive.status === 403, 'Deactivated teacher still has Edge access.');
    requireResult((await ownRows(resetLogin.access_token)).length === 0, 'Deactivated teacher still sees profile.');
    log('PASS hosted-acceptance reset-deactivate-old-token-denial');
    completed = true;
  } catch (error) {
    firstError = error;
  } finally {
    // Recover even an orphan whose Edge provision response failed, but never touch
    // accounts beyond this run's exact synthetic names.
    if (startedMutation) {
      try {
        const users = await listUsers();
        for (const user of users) {
          if (names.some((entry) => entry.email === user.email) && uuid.test(user.id ?? '')) {
            createdIds.add(user.id);
          }
        }
        for (const id of createdIds) {
          const deleted = await api('/auth/v1/admin/users/' + id, { service: true, method: 'DELETE' });
          requireResult(deleted.ok, 'Synthetic cleanup DELETE failed.');
        }
        requireResult((await listUsers()).length === 0, 'Auth user remains after cleanup; reconcile manually.');
        requireResult((await profiles()).length === 0, 'Profile remains after cleanup; reconcile manually.');
        log('PASS hosted-acceptance cleanup-no-remaining-users');
      } catch {
        firstError = new Error('HOSTED_ACCEPTANCE_FAILED: Cleanup incomplete; inspect staging synthetic lbqa_ accounts before retrying.');
      }
    }
  }
  if (firstError) throw firstError;
  requireResult(completed, 'Acceptance did not complete.');
  return 7;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  runHostedAcceptance(process.env)
    .then((n) => console.log('HOSTED_SYNTHETIC_ACCEPTANCE_PASS: ' + n + ' bounded checks.'))
    .catch((e) => {
      // Only controlled failure labels; never log tokens, passwords, response data.
      const message = e instanceof Error ? e.message : '';
      console.error(
        message.startsWith('HOSTED_ACCEPTANCE_')
          ? message
          : 'HOSTED_ACCEPTANCE_FAILED: Unexpected error (details intentionally redacted).',
      );
      process.exitCode = 1;
    });
}
