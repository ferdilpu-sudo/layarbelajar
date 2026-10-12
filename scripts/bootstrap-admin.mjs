import { stdin, stdout } from 'node:process';
import { localSupabaseEnv, localRequest } from './local-supabase-env.mjs';

function readSecret(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || !stdin.setRawMode) {
      reject(new Error('Secure password prompt needs interactive terminal.'));
      return;
    }
    stdout.write(prompt);
    let secret = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    const handle = (char) => {
      if (char === '\u0003') {
        cleanup();
        reject(new Error('Cancelled'));
      } else if (char === '\r' || char === '\n') {
        cleanup();
        stdout.write('\n');
        resolve(secret);
      } else if (char === '\u007f') {
        secret = secret.slice(0, -1);
      } else if (/^[\x20-\x7e]$/.test(char)) {
        secret += char;
      }
    };
    function cleanup() {
      stdin.off('data', handle);
      stdin.setRawMode(false);
      stdin.pause();
    }
    stdin.on('data', handle);
  });
}

function validateText(value, max) {
  return typeof value === 'string' && value.length >= 1 && value.length <= max && value === value.trim();
}

const [usernameArg, displayArg] = process.argv.slice(2);
const username = (usernameArg ?? '').trim().toLowerCase();
const displayName = (displayArg ?? '').trim();
if (!/^[a-z0-9_]{3,32}$/.test(username) || !validateText(displayName, 80)) {
  console.error('Usage: npm run bootstrap:admin -- <username> "<display name>"');
  process.exit(1);
}
const { url, serviceKey } = localSupabaseEnv();
const password = await readSecret('Password admin (12+ characters, hidden): ');
if (password.length < 12) throw new Error('Password minimum 12 characters.');

let createdId;
try {
  const auth = await localRequest(url, serviceKey, '/auth/v1/admin/users', {
    method: 'POST',
    body: { email: username + '@accounts.invalid', password, email_confirm: true },
  });
  if (!auth.ok || typeof auth.data?.id !== 'string') throw new Error('Admin Auth create failed.');
  createdId = auth.data.id;
  const profile = await localRequest(url, serviceKey, '/rest/v1/profiles', {
    method: 'POST',
    body: { id: createdId, username, display_name: displayName, role: 'admin', active: true, must_change_password: false },
  });
  if (!profile.ok) throw new Error('Admin profile create failed.');
  console.log('Local admin bootstrapped successfully. Credentials never printed.');
} catch (error) {
  if (createdId) {
    const rollback = await localRequest(url, serviceKey, '/auth/v1/admin/users/' + createdId, {
      method: 'DELETE',
    });
    if (!rollback.ok) console.error('ROLLBACK FAILED: manually reconcile orphan Auth ID:', createdId);
  }
  throw error;
}
