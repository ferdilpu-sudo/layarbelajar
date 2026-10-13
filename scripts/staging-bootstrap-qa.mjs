import { randomBytes } from 'node:crypto';
import { validateConfig } from './hosted-auth-acceptance.mjs';

export const OWNER_CONFIRMATION = 'BOOTSTRAP_SYNTHETIC_STAGING';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireSafe(ok, label) {
  if (!ok) throw new Error('WINDOWS_BOOTSTRAP_BLOCKED: ' + label);
}

async function request(cfg, fetcher, path, options = {}) {
  const { key = cfg.service, token, method = 'GET', body } = options;
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
        ...(path === '/rest/v1/profiles' && method === 'POST'
          ? { Prefer: 'return=representation' }
          : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error('WINDOWS_BOOTSTRAP_FAILED: Staging API unreachable.');
  }
  requireSafe(response.status < 300 || response.status >= 400, 'Unexpected HTTP redirect.');
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Do not print sensitive response bodies.
  }
  return { ok: response.ok, status: response.status, data };
}

export async function runStagingBootstrapQa({
  anonKey,
  serviceKey,
  getPassword,
  getConfirmation,
  fetcher = fetch,
  log = console.log,
}) {
  const cfg = validateConfig({
    STAGING_ACCEPTANCE_CONFIRM: 'RUN_SYNTHETIC_STAGING_ONLY',
    STAGING_PROJECT_REF: 'qfkjcjzwhewsbblgumco',
    STAGING_SUPABASE_URL: 'https://qfkjcjzwhewsbblgumco.supabase.co',
    STAGING_APP_ORIGIN: 'https://layarbelajar.pages.dev',
    STAGING_ANON_KEY: anonKey,
    STAGING_SERVICE_ROLE_KEY: serviceKey,
  });
  const username = 'lbqa_win_' + randomBytes(5).toString('hex') + '_admin';
  const email = username + '@accounts.invalid';
  const created = new Set();
  let mutationAttempted = false;
  let failure = null;

  const call = (path, opts) => request(cfg, fetcher, path, opts);
  async function userList() {
    const result = await call('/auth/v1/admin/users?per_page=100&page=1');
    requireSafe(
      result.ok && Array.isArray(result.data?.users),
      'Auth user inventory not available.',
    );
    return result.data.users;
  }
  async function profileList() {
    const result = await call('/rest/v1/profiles?select=id&limit=1');
    requireSafe(result.ok && Array.isArray(result.data), 'Profiles inventory not available.');
    return result.data;
  }

  // All checks are read-only until the owner explicitly confirms.
  const health = await call('/auth/v1/health', { key: cfg.anon });
  requireSafe(health.status === 200, 'GoTrue health not ready.');
  const settings = await call('/auth/v1/settings', { key: cfg.anon });
  requireSafe(
    settings.ok &&
      settings.data?.disable_signup === true &&
      settings.data?.external?.email === true,
    'Expected signup-disabled email Auth policy.',
  );
  requireSafe((await userList()).length === 0, 'Nonempty Auth users; no changes made.');
  requireSafe((await profileList()).length === 0, 'Nonempty profiles; no changes made.');
  log('PASS windows-bootstrap preflight-empty-staging');

  // Do not accept credentials from CLI arguments, environment or files.
  const password = await getPassword();
  requireSafe(
    typeof password === 'string' && password.length >= 12 && password.length <= 128,
    'Admin test password must be 12 to 128 characters.',
  );
  requireSafe(
    (await getConfirmation()) === OWNER_CONFIRMATION,
    'Owner confirmation missing; no changes made.',
  );

  try {
    mutationAttempted = true;
    const auth = await call('/auth/v1/admin/users', {
      method: 'POST',
      body: { email, password, email_confirm: true },
    });
    requireSafe(auth.ok && UUID.test(auth.data?.id ?? ''), 'Synthetic Auth create failed.');
    const id = auth.data.id;
    created.add(id);

    const inserted = await call('/rest/v1/profiles', {
      method: 'POST',
      body: {
        id,
        username,
        display_name: 'Admin Windows QA',
        role: 'admin',
        active: true,
        must_change_password: false,
      },
    });
    requireSafe(inserted.ok, 'Synthetic admin profile create failed.');
    log('PASS windows-bootstrap admin-created');

    const signedIn = await call('/auth/v1/token?grant_type=password', {
      key: cfg.anon,
      method: 'POST',
      body: { email, password },
    });
    requireSafe(
      signedIn.ok && typeof signedIn.data?.access_token === 'string',
      'Synthetic admin login failed.',
    );
    const own = await call('/rest/v1/profiles?select=id,role,active,must_change_password', {
      key: cfg.anon,
      token: signedIn.data.access_token,
    });
    requireSafe(
      own.ok &&
        own.data?.length === 1 &&
        own.data[0]?.id === id &&
        own.data[0]?.role === 'admin' &&
        own.data[0]?.active === true &&
        own.data[0]?.must_change_password === false,
      'Windows admin profile RLS/readiness mismatch.',
    );
    log('PASS windows-bootstrap admin-login-and-profile');
  } catch {
    failure = new Error('WINDOWS_BOOTSTRAP_FAILED: Staging synthetic bootstrap.');
  } finally {
    if (mutationAttempted) {
      try {
        // Only delete this run's specific synthetic user. A timeout after create
        // may have lost the ID response, so discover by exact generated email.
        const found = await userList();
        for (const user of found) {
          if (user.email === email && UUID.test(user.id ?? '')) {
            created.add(user.id);
          }
        }
        for (const id of created) {
          const removed = await call('/auth/v1/admin/users/' + id, {
            method: 'DELETE',
          });
          requireSafe(removed.ok, 'Synthetic cleanup failed.');
        }
        requireSafe((await userList()).length === 0, 'Auth account remains.');
        requireSafe((await profileList()).length === 0, 'Profile remains.');
        log('PASS windows-bootstrap cleanup-empty-staging');
      } catch {
        failure = new Error(
          'WINDOWS_BOOTSTRAP_CLEANUP_BLOCKED: ' +
            'Inspect only lbqa_win_ accounts on staging before retry.',
        );
      }
    }
  }
  if (failure) throw failure;
  return 4;
}
