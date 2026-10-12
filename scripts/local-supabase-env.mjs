import { execFileSync } from 'node:child_process';

export function localSupabaseEnv() {
  // CLI emits local secrets. Capture stdout into memory; never print or persist them.
  const output = execFileSync('supabase', ['status', '-o', 'env'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const values = Object.fromEntries(
    output.split(/\r?\n/).filter((line) => /^[A-Z_]+=/.test(line)).map((line) => {
      const idx = line.indexOf('=');
      const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      return [line.slice(0, idx), value];
    }),
  );
  const url = process.env.SUPABASE_URL || values.API_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || values.SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || values.ANON_KEY;
  if (!url || !serviceKey || !anonKey || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(url)) {
    throw new Error('Local Supabase endpoint/keys missing or URL is not loopback. Start Supabase locally.');
  }
  return { url: url.replace(/\/$/, ''), serviceKey, anonKey };
}

export async function localRequest(url, key, pathname, { method = 'GET', body, token } = {}) {
  const response = await fetch(url + pathname, {
    method,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + (token || key),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(method === 'POST' && pathname.startsWith('/rest/') ? { Prefer: 'return=representation' } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }
  return { ok: response.ok, status: response.status, data };
}
