import { describe, expect, it } from 'vitest';
import { PROFILE_RECHECK_MS, REFRESH_EARLY_MS, shouldRenew, shouldRevalidate } from './sessionExpiry';

describe('in-memory session lifecycle rules', () => {
  it('renews near expiry or already expired', () => {
    expect(shouldRenew(1000 + REFRESH_EARLY_MS + 1, 1000)).toBe(false);
    expect(shouldRenew(1000 + REFRESH_EARLY_MS, 1000)).toBe(true);
    expect(shouldRenew(1, 1000)).toBe(true);
    expect(shouldRenew(Number.NaN, 1000)).toBe(true);
  });
  it('revalidates even when access token remains valid', () => {
    expect(shouldRevalidate(1000, 1000 + PROFILE_RECHECK_MS - 1)).toBe(false);
    expect(shouldRevalidate(1000, 1000 + PROFILE_RECHECK_MS)).toBe(true);
  });
});
