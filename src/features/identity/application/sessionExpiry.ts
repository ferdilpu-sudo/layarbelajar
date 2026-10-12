// Refresh early; do not rely on the user's wall clock matching GoTrue exactly.
export const REFRESH_EARLY_MS = 90_000;
export const PROFILE_RECHECK_MS = 60_000;
export function shouldRenew(expiresAt: number, now: number = Date.now()): boolean {
  return !Number.isFinite(expiresAt) || expiresAt - now <= REFRESH_EARLY_MS;
}
export function shouldRevalidate(lastCheckedAt: number, now: number = Date.now()): boolean {
  return now - lastCheckedAt >= PROFILE_RECHECK_MS;
}
