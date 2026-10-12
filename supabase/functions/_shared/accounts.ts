/* global Deno */
export type UserProfile = { id: string; username: string; display_name: string; role: 'admin' | 'teacher' | 'student'; active: boolean; must_change_password: boolean };
type FailureCode = 'VALIDATION_ERROR' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR';
export class HttpFailure extends Error {
  constructor(public status: number, public code: FailureCode, message: string) { super(message); }
}
const usernamePattern = /^[a-z0-9_]{3,32}$/;
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const secretCharacters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';

export function normalizedUsername(value: unknown): string {
  if (typeof value !== 'string') throw new HttpFailure(400, 'VALIDATION_ERROR', 'Username tidak valid.');
  const name = value.trim().toLowerCase();
  if (!usernamePattern.test(name)) throw new HttpFailure(400, 'VALIDATION_ERROR', 'Username tidak valid.');
  return name;
}
export function passwordValid(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 12 && value.length <= 128;
}
export function temporaryPassword(): string {
  const seed = new Uint32Array(28);
  crypto.getRandomValues(seed);
  return Array.from(seed, (v) => secretCharacters[v % secretCharacters.length]).join('');
}
function environment() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !serviceKey || !anonKey) throw new HttpFailure(500, 'INTERNAL_ERROR', 'Konfigurasi layanan tidak tersedia.');
  return { url: url.replace(/\/$/, ''), serviceKey, anonKey };
}
export async function backend(path: string, options: { method?: string; body?: unknown; userToken?: string; service?: boolean } = {}) {
  const env = environment();
  const key = options.service ? env.serviceKey : env.anonKey;
  const response = await fetch(env.url + path, {
    method: options.method ?? 'GET',
    headers: {
      apikey: key, Authorization: 'Bearer ' + (options.userToken ?? key),
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(options.method === 'POST' && path.startsWith('/rest/') ? { Prefer: 'return=representation' } : {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const raw = await response.text();
  let value: unknown = null;
  try { value = raw ? JSON.parse(raw) : null; } catch { /* do not echo service body */ }
  return { ok: response.ok, status: response.status, data: value };
}
export function dataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function allowedOrigin(req: Request): string | null {
  const origin = req.headers.get('origin');
  if (!origin) return null;
  const configured = Deno.env.get('APP_ALLOWED_ORIGINS');
  const localDefaults = (Deno.env.get('SUPABASE_URL') ?? '').startsWith('http://') ? 'http://localhost:5173,http://127.0.0.1:5173' : '';
  const allowed = (configured ?? localDefaults).split(',').map(s => s.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}
export function cors(req: Request): HeadersInit {
  const allow = allowedOrigin(req);
  return allow ? { 'Access-Control-Allow-Origin': allow, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', Vary: 'Origin' } : { Vary: 'Origin' };
}
export function reply(req: Request, status: number, content: Record<string, unknown>) {
  return new Response(JSON.stringify({ ...content, request_id: crypto.randomUUID() }), {
    status, headers: { ...cors(req), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
export function failure(req: Request, cause: unknown) {
  if (cause instanceof HttpFailure) return reply(req, cause.status, { error: { code: cause.code, message: cause.message } });
  // No stack traces, credentials or raw Auth responses in client messages.
  console.error('Account operation failed:', cause instanceof Error ? cause.message : 'unknown');
  return reply(req, 500, { error: { code: 'INTERNAL_ERROR', message: 'Operasi akun belum berhasil.' } });
}
export function methodAndOrigin(req: Request, methods: readonly string[]): Response | null {
  if (req.headers.get('origin') && !allowedOrigin(req)) return reply(req, 403, { error: { code: 'FORBIDDEN', message: 'Asal permintaan tidak diizinkan.' } });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
  if (!methods.includes(req.method)) return reply(req, 405, { error: { code: 'VALIDATION_ERROR', message: 'Metode tidak didukung.' } });
  return null;
}
export async function bodyObject(req: Request): Promise<Record<string, unknown>> {
  if (Number(req.headers.get('content-length') ?? '0') > 4096) throw new HttpFailure(400, 'VALIDATION_ERROR', 'Permintaan terlalu besar.');
  let body: unknown;
  try { body = await req.json(); } catch { throw new HttpFailure(400, 'VALIDATION_ERROR', 'JSON tidak valid.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpFailure(400, 'VALIDATION_ERROR', 'Payload tidak valid.');
  return body as Record<string, unknown>;
}
export async function identify(req: Request, requireAdmin = false): Promise<UserProfile> {
  const authorization = req.headers.get('authorization') ?? '';
  const match = /^Bearer ([-\w.]+)$/.exec(authorization);
  if (!match) throw new HttpFailure(401, 'UNAUTHENTICATED', 'Masuk terlebih dahulu.');
  const auth = await backend('/auth/v1/user', { userToken: match[1] });
  const userId = dataRecord(auth.data).id;
  if (!auth.ok || typeof userId !== 'string' || !uuidPattern.test(userId)) throw new HttpFailure(401, 'UNAUTHENTICATED', 'Sesi tidak valid.');
  const fetched = await backend('/rest/v1/profiles?id=eq.' + encodeURIComponent(userId) + '&select=id,username,display_name,role,active,must_change_password', { service: true });
  if (!fetched.ok) throw new HttpFailure(500, 'INTERNAL_ERROR', 'Profil tidak dapat diperiksa.');
  const profile = Array.isArray(fetched.data) ? fetched.data[0] as UserProfile | undefined : undefined;
  if (!profile || !profile.active) throw new HttpFailure(403, 'FORBIDDEN', 'Akun tidak aktif atau belum disiapkan.');
  if (requireAdmin && (profile.must_change_password || profile.role !== 'admin')) throw new HttpFailure(403, 'FORBIDDEN', 'Hanya admin aktif yang diizinkan.');
  return profile;
}
export async function updateProfile(id: string, patch: Record<string, unknown>) {
  const result = await backend('/rest/v1/profiles?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body: patch, service: true });
  if (!result.ok) throw new HttpFailure(500, 'INTERNAL_ERROR', 'Profil tidak dapat diperbarui.');
}
export async function getTarget(id: unknown): Promise<UserProfile> {
  if (typeof id !== 'string' || !uuidPattern.test(id)) throw new HttpFailure(400, 'VALIDATION_ERROR', 'ID akun tidak valid.');
  const response = await backend('/rest/v1/profiles?id=eq.' + encodeURIComponent(id) + '&select=id,username,display_name,role,active,must_change_password', { service: true });
  if (!response.ok) throw new HttpFailure(500, 'INTERNAL_ERROR', 'Pemeriksaan akun gagal.');
  const target = Array.isArray(response.data) ? response.data[0] as UserProfile | undefined : undefined;
  if (!target) throw new HttpFailure(404, 'NOT_FOUND', 'Akun tidak ditemukan.');
  return target;
}
