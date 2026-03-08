import { useEffect, useState, useRef } from 'react';

type Zone = 'dark' | 'light';

/**
 * Reports whether the cursor is currently over a dark or light zone.
 * Uses data-cursor-zone="dark"|"light" attributes on section elements.
 * Falls back to 'dark' if no zone is detected.
 */
export function useCursorZone(): Zone {
  const [zone, setZone] = useState<Zone>('dark');
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // Get the topmost element under the cursor and walk up its ancestors
        const top = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (top) {
          const zoneEl = top.closest<HTMLElement>('[data-cursor-zone]');
          if (zoneEl) {
            const val = zoneEl.dataset.cursorZone;
            if (val === 'dark' || val === 'light') {
              setZone(val);
              return;
            }
          }
        }
        setZone('dark');
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return zone;
}
