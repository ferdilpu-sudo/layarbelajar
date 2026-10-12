import { aliasForUsername } from '../domain/usernameAlias';

export type Role = 'admin' | 'teacher' | 'student';
export type AuthIdentity = { username: string; role: Role | null; must_change_password: boolean };
export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  identity: AuthIdentity;
};
export type ManagedAccount = {
  id: string;
  username: string;
  display_name: string;
  role: Role;
  active: boolean;
  must_change_password: boolean;
};

function configuration() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!url || !key || !/^https?:\/\//.test(url)) {
    throw new Error('Supabase belum dikonfigurasi. Periksa .env.local.');
  }
  return { url: url.replace(/\/$/, ''), key };
}
async function jsonRequest(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const result: unknown = await response.json().catch(() => null);
  const record =
    result && typeof result === 'object' && !Array.isArray(result)
      ? (result as Record<string, unknown>)
      : {};
  if (!response.ok) {
    const error = record.error;
    const detail =
      error && typeof error === 'object' ? (error as Record<string, unknown>).message : undefined;
    throw new Error(
      typeof detail === 'string' ? detail : 'Permintaan belum berhasil. Periksa akun dan koneksi.',
    );
  }
  return record;
}
export async function functionCall(
  token: string,
  name: 'change-password' | 'account-admin',
  body?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { url, key } = configuration();
  const response = await jsonRequest(url + '/functions/v1/' + name, {
    method: body ? 'POST' : 'GET',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + token,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return response.data && typeof response.data === 'object'
    ? (response.data as Record<string, unknown>)
    : {};
}
function parseToken(record: Record<string, unknown>, identity: AuthIdentity): Session {
  if (
    typeof record.access_token !== 'string' ||
    typeof record.refresh_token !== 'string' ||
    record.refresh_token.length === 0 ||
    typeof record.expires_in !== 'number' ||
    !Number.isFinite(record.expires_in) ||
    record.expires_in <= 0
  ) {
    throw new Error('Sesi Auth tidak lengkap.');
  }
  return {
    accessToken: record.access_token,
    refreshToken: record.refresh_token,
    expiresAt: Date.now() + record.expires_in * 1000,
    identity,
  };
}
export async function refreshIdentity(token: string): Promise<AuthIdentity> {
  const value = (await functionCall(token, 'change-password')) as AuthIdentity;
  if (
    typeof value.username !== 'string' ||
    typeof value.must_change_password !== 'boolean' ||
    !(value.role === null || value.role === 'admin' || value.role === 'teacher' || value.role === 'student')
  ) {
    throw new Error('Status akun tidak tersedia.');
  }
  return value;
}
export async function signIn(username: string, password: string): Promise<Session> {
  const { url, key } = configuration();
  const auth = await jsonRequest(url + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: aliasForUsername(username), password }),
  });
  const token = auth.access_token;
  if (typeof token !== 'string') throw new Error('Sesi login tidak tersedia.');
  const identity = await refreshIdentity(token);
  return parseToken(auth, identity);
}
export async function renewSession(current: Session): Promise<Session> {
  const { url, key } = configuration();
  const auth = await jsonRequest(url + '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: current.refreshToken }),
  });
  if (typeof auth.access_token !== 'string') throw new Error('Perpanjangan sesi gagal.');
  // Recheck active/password-pending/role server side after rotating a refresh token.
  const identity = await refreshIdentity(auth.access_token);
  if (identity.username !== current.identity.username) throw new Error('Identitas sesi berubah.');
  return parseToken(auth, identity);
}
export async function revokeSession(token: string): Promise<void> {
  const { url, key } = configuration();
  await fetch(url + '/auth/v1/logout', {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + token },
    cache: 'no-store',
  });
}
