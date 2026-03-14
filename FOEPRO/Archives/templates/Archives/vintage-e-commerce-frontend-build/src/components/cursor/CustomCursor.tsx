import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useCursorZone } from '@/hooks/useCursorZone';
import { usePerformance } from '@/context/PerformanceContext';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const zone = useCursorZone();
  const { useCustomCursor } = usePerformance();
  const [hoverType, setHoverType] = useState<'none' | 'interactive' | 'grab'>('none');
  const [isTouch, setIsTouch] = useState(false);

  const posRef = useRef({ x: 0, y: 0 });
  const quickX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const quickY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const enabled = useCustomCursor && !isTouch;

  // Toggle native cursor visibility via body class.
  useEffect(() => {
    if (enabled) {
      document.body.classList.add('hide-native-cursor');
    } else {
      document.body.classList.remove('hide-native-cursor');
    }
    return () => {
      document.body.classList.remove('hide-native-cursor');
    };
  }, [enabled]);

  // Initialize GSAP quickTo setters whenever custom cursor is enabled.
  useEffect(() => {
    if (!enabled || !cursorRef.current) {
      quickX.current = null;
      quickY.current = null;
      return;
    }

    const el = cursorRef.current;
    quickX.current = gsap.quickTo(el, 'x', {
      duration: 0.15,
      ease: 'power3.out',
    });
    quickY.current = gsap.quickTo(el, 'y', {
      duration: 0.15,
      ease: 'power3.out',
    });

    gsap.set(el, { x: posRef.current.x, y: posRef.current.y });

    return () => {
      quickX.current = null;
      quickY.current = null;
    };
  }, [enabled]);

  // Track mouse position continuously; animate only when enabled.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!enabled) return;
      quickX.current?.(e.clientX);
      quickY.current?.(e.clientY);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [enabled]);

  // Detect hover targets only while custom cursor is active.
  useEffect(() => {
    if (!enabled) {
      setHoverType('none');
      return;
    }

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (target.tagName === 'CANVAS' || target.closest('[data-cursor="grab"]')) {
        setHoverType('grab');
        return;
      }

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
  }, [enabled]);

  if (!enabled) return null;

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
