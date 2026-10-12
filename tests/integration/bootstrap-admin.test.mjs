import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { localSupabaseEnv, localRequest } from '../../scripts/local-supabase-env.mjs';

const env = localSupabaseEnv();
test(
  'bootstrap admin runs through an interactive hidden-password pseudo-terminal',
  {
    skip:
      process.platform !== 'linux'
        ? 'Pseudo-terminal test requires Linux util-linux script'
        : false,
    timeout: 25_000,
  },
  async (t) => {
    const name = 'lb_boot_' + randomBytes(5).toString('hex');
    const password = randomBytes(23).toString('base64url') + 'Aa34!';
    let userId;
    t.after(async () => {
      if (userId) {
        const removed = await localRequest(
          env.url,
          env.serviceKey,
          '/auth/v1/admin/users/' + userId,
          {
            method: 'DELETE',
          },
        );
        assert.equal(removed.ok, true, 'Bootstrap fixture must be cleaned');
      }
    });
    const output = await new Promise((resolve, reject) => {
      // Only username and display name are command args. The password is written
      // AFTER the script's hidden terminal prompt; never exported to args/env/logs.
      const child = spawn(
        'script',
        [
          '-q',
          '-e',
          '-c',
          'node scripts/bootstrap-admin.mjs ' + name + ' "Admin Uji Lokal"',
          '/dev/null',
        ],
        { stdio: ['pipe', 'pipe', 'pipe'] },
      );
      let transcript = '';
      let answered = false;
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('Bootstrap interactive prompt timed out. Sanitized child output: ' + transcript.replaceAll(password, '[REDACTED]').slice(-480)));
      }, 16_000);
      child.stdout.on('data', (data) => {
        transcript += data.toString();
        if (!answered && transcript.includes('Password admin (12+ characters, hidden):')) {
          answered = true;
          child.stdin.write(password + '\n');
        }
      });
      child.stderr.on('data', (data) => {
        transcript += data.toString();
      });
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0 || !answered) {
          reject(new Error('Bootstrap failed with status ' + String(code) + ', diagnostic: ' + transcript.replaceAll(password, '[REDACTED]').slice(-480)));
        } else {
          resolve(transcript);
        }
      });
    });
    assert.equal(output.includes(password), false, 'Password must not be echoed');
    assert.ok(output.includes('Local admin bootstrapped successfully'), 'Bootstrap should succeed');
    const profile = await localRequest(
      env.url,
      env.serviceKey,
      '/rest/v1/profiles?username=eq.' + name + '&select=id,role,active,must_change_password',
    );
    assert.equal(profile.ok, true);
    assert.equal(profile.data?.length, 1);
    userId = profile.data[0].id;
    assert.equal(profile.data[0].role, 'admin');
    assert.equal(profile.data[0].active, true);
    assert.equal(profile.data[0].must_change_password, false);
    const session = await localRequest(env.url, env.anonKey, '/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email: name + '@accounts.invalid', password },
    });
    assert.equal(session.ok, true, 'Bootstrapped admin must be able to log in');
  },
);
