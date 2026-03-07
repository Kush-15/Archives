import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useCursorZone } from '@/hooks/useCursorZone';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const zone = useCursorZone();
  const [hoverType, setHoverType] = useState<'none' | 'interactive' | 'grab'>('none');
  const posRef = useRef({ x: 0, y: 0 });
  const quickX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const quickY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  // Initialize quickTo for sub-frame cursor response
  useEffect(() => {
    if (!cursorRef.current) return;
    quickX.current = gsap.quickTo(cursorRef.current, 'x', {
      duration: 0.15,
      ease: 'power3.out',
    });
    quickY.current = gsap.quickTo(cursorRef.current, 'y', {
      duration: 0.15,
      ease: 'power3.out',
    });
  }, []);

  // Track mouse position
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      quickX.current?.(e.clientX);
      quickY.current?.(e.clientY);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Detect hover targets
  useEffect(() => {
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Check for 3D canvas hover
      if (target.tagName === 'CANVAS' || target.closest('[data-cursor="grab"]')) {
        setHoverType('grab');
        return;
      }

      // Check for interactive elements
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('[data-cursor="pointer"]')
      ) {
        setHoverType('interactive');
        return;
      }

      setHoverType('none');
    };

    window.addEventListener('mouseover', onOver, { passive: true });
    return () => window.removeEventListener('mouseover', onOver);
  }, []);

  // Check for touch device
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  if (isTouch) return null;

  const zoneClass = zone === 'dark' ? 'custom-cursor--dark-zone' : 'custom-cursor--light-zone';
  const hoverClass =
    hoverType === 'interactive'
      ? 'custom-cursor--hover'
      : hoverType === 'grab'
        ? 'custom-cursor--grab'
        : '';

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor ${zoneClass} ${hoverClass}`}
      aria-hidden="true"
    >
      {hoverType === 'grab' && (
        <div className="cursor-rotate-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
          </svg>
        </div>
      )}
    </div>
  );
}
