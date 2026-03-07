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
        // Walk up from the element under the cursor to find a zone
        const els = document.elementsFromPoint(e.clientX, e.clientY);
        for (const el of els) {
          const zoneAttr = (el as HTMLElement).dataset?.cursorZone;
          if (zoneAttr === 'dark' || zoneAttr === 'light') {
            setZone(zoneAttr);
            return;
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
