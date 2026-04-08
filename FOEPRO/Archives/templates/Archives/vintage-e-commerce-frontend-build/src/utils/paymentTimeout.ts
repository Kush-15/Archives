/**
 * Utilities for formatting payment timeouts.
 */

/**
 * Format milliseconds into M:SS
 */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return '0:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  
  return `${m}:${s.toString().padStart(2, '0')}`;
}
