import { useState, useCallback, useRef, useEffect } from 'react';

// Editorial character set: uppercase + sparse symbols for archival aesthetic.
// Avoid numbers — they feel digital; lean into print-era marks instead.
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ·—×▪◆';
const INTERVAL_MS = 16; // ~60fps
const TOTAL_DURATION_MS = 360; // slightly snappier than 420ms

export function useTextScramble(text: string) {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frameRef = useRef(0);
  const isScrambling = useRef(false);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isScrambling.current = false;
    setDisplay(text);
  }, [text]);

  const trigger = useCallback(() => {
    // If already scrambling, reset
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    frameRef.current = 0;
    isScrambling.current = true;
    const totalFrames = Math.ceil(TOTAL_DURATION_MS / INTERVAL_MS);
    const chars = text.split('');

    intervalRef.current = setInterval(() => {
      frameRef.current++;
      const progress = frameRef.current / totalFrames;

      const result = chars.map((char, i) => {
        if (char === ' ') return ' ';
        // Exponential ramp: first char resolves at ~25%, last snaps at 100%.
        // Squaring the index fraction front-loads resolution — feels like a fast
        // left-to-right decode rather than a uniform reveal.
        const frac = chars.length > 1 ? i / (chars.length - 1) : 1;
        const resolveAt = 0.25 + frac * frac * 0.75;
        if (progress >= resolveAt) return char;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join('');

      setDisplay(result);

      if (frameRef.current >= totalFrames) {
        // All resolved — brief pause then letter-spacing breathe
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        isScrambling.current = false;
        setDisplay(text);
      }
    }, INTERVAL_MS);
  }, [text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Snap to correct text if text prop changes
  useEffect(() => {
    if (!isScrambling.current) {
      setDisplay(text);
    }
  }, [text]);

  return { display, trigger, stop };
}
