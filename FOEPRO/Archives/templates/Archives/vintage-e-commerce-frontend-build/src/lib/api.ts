/**
 * API helper for cross-origin requests between Vite dev server and Django.
 *
 * In development, the Vite dev server runs on 127.0.0.1:3000 while Django
 * runs on 127.0.0.1:8000.  All API calls need to hit Django, not Vite.
 *
 * In production, the SPA is served by Django so relative URLs work fine
 * (VITE_BACKEND_BASE_URL can be left empty or unset).
 */

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_BASE_URL ?? '').replace(/\/+$/, '');

/**
 * Prepend the backend base URL to a relative path.
 *
 * @example apiUrl('/api/signin/')  // "http://127.0.0.1:8000/api/signin/" in dev
 */
export function apiUrl(path: string): string {
  return `${BACKEND_BASE}${path}`;
}

/**
 * Thin wrapper around `fetch()` that automatically prepends the backend URL
 * and sets `credentials: 'include'` so cookies travel cross-origin.
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    credentials: 'include',
    ...init,
  });
}
