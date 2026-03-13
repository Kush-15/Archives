/**
 * Read the Django CSRF token from the cookie set by @ensure_csrf_cookie.
 */
export function getCsrfToken(): string {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrftoken='));
  return match ? match.split('=')[1] : '';
}
