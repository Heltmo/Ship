/**
 * Validates redirect paths to prevent open redirect vulnerabilities.
 *
 * Prevents:
 * - Protocol-relative URLs (//evil.com)
 * - Backslash bypasses (/\evil.com)
 * - Absolute URLs
 * - Encoded bypasses
 *
 * @param path - The redirect path to validate
 * @returns true if the path is a safe relative path
 */
export function isValidRedirect(path: string): boolean {
  if (!path || typeof path !== 'string') return false;

  // Must start with /
  if (!path.startsWith('/')) return false;

  // Prevent protocol-relative URLs and backslash bypasses
  if (path.startsWith('//') || path.startsWith('/\\')) return false;

  // Additional validation: parse as URL to catch edge cases
  try {
    const url = new URL(path, 'https://dummy.com');
    // Ensure it's a relative path (hostname should be dummy.com)
    return url.pathname === path && url.hostname === 'dummy.com';
  } catch {
    return false;
  }
}
