const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;
const ALIAS_DOMAIN = 'accounts.invalid';

export function normalizeUsername(input: string): string {
  const username = input.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error('Username harus 3–32 karakter (huruf kecil, angka, atau _).');
  }
  return username;
}

/** Internal Auth identifier only; never send email to this domain. */
export function aliasForUsername(input: string): string {
  return normalizeUsername(input) + '@' + ALIAS_DOMAIN;
}
