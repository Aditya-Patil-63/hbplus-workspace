/**
 * Domain validation utilities for HB Plus Workspace.
 * Enforces strict authentication restrictions to the authorized company domain.
 */

export const ALLOWED_DOMAIN = (
  process.env.EXPO_PUBLIC_ALLOWED_DOMAIN ?? 'hbplus.fit'
).toLowerCase();

/**
 * Validates that an email belongs strictly to the authorized company domain.
 *
 * Rules:
 * - Trims and lowercases the input.
 * - Rejects null, undefined, empty, or whitespace-only strings.
 * - Requires exactly one '@' character.
 * - Requires a non-empty user identifier before '@'.
 * - Requires the domain part after '@' to strictly match ALLOWED_DOMAIN.
 *
 * @param email - The email address to test.
 * @returns true if email is strictly inside ALLOWED_DOMAIN, false otherwise.
 */
export function isAllowedEmail(email?: string | null): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const parts = normalized.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [username, domain] = parts;

  if (!username || !domain) {
    return false;
  }

  return domain === ALLOWED_DOMAIN;
}

