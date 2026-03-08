import { useState, useCallback, useRef, useEffect } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01234';
const INTERVAL_MS = 16; // ~60fps
const TOTAL_DURATION_MS = 420;

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
        // Left-to-right decode: each char resolves based on its position
        const resolveAt = (i / chars.length) * 0.7 + 0.3; // first char resolves at ~30%, last at ~100%
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
