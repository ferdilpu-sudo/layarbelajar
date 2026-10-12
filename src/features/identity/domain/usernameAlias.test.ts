import { describe, expect, it } from 'vitest';
import { aliasForUsername, normalizeUsername } from './usernameAlias';

describe('username alias normalization (TASK-006)', () => {
  it('trim + lowercase with fixed technical domain', () => {
    expect(normalizeUsername('  GuRu_01 ')).toBe('guru_01');
    expect(aliasForUsername(' GuRu_01 ')).toBe('guru_01@accounts.invalid');
  });
  it.each(['a', 'AB CD', 'name@example.com', 'äda', 'user-name', 'a'.repeat(33), ''])(
    'rejects invalid username: %s',
    (value) => expect(() => aliasForUsername(value)).toThrow(),
  );
  it('does not accept caller-supplied domain or email addresses', () => {
    expect(() => aliasForUsername('somebody@evil.com')).toThrow();
  });
});
