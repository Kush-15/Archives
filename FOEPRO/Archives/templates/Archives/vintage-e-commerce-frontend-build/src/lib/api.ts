/**
 * API helper for cross-origin requests between Vite dev server and Django.
 *
 * In development, the Vite dev server runs on 127.0.0.1:3000 while Django
 * runs on 127.0.0.1:8000.  All API calls need to hit Django, not Vite.
 *
 * In production, the SPA is served by Django so relative URLs work fine
 * (VITE_BACKEND_BASE_URL can be left empty or unset).
 */

import { getCsrfToken } from '@/utils/csrf';

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_BASE_URL ?? '').replace(/\/+$/, '');

/** Default request timeout in milliseconds */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Prepend the backend base URL to a relative path.
 *
 * @example apiUrl('/api/signin/')  // "http://127.0.0.1:8000/api/signin/" in dev
 */
export function apiUrl(path: string): string {
  return `${BACKEND_BASE}${path}`;
}

/**
 * Thin wrapper around `fetch()` that automatically:
 * - Prepends the backend URL
 * - Sets `credentials: 'include'` so cookies travel cross-origin
 * - Adds CSRF token for mutating requests (POST/PUT/PATCH/DELETE)
 * - Adds a configurable timeout via AbortController
 */
export function apiFetch(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchInit } = init ?? {};

  // Attach CSRF token for mutating requests
  const method = (fetchInit.method ?? 'GET').toUpperCase();
  const isMutating = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';

  const headers = new Headers(fetchInit.headers);
  if (isMutating) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
    }
  }

  // Timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Merge any existing signal (unlikely but safe)
  const signal = fetchInit.signal
    ? fetchInit.signal
    : controller.signal;

  return fetch(apiUrl(path), {
    credentials: 'include',
    ...fetchInit,
    headers,
    signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}
