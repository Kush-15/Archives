import { useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';

interface SpringConfig {
  ease?: string;
  duration?: number;
}

const PRESETS = {
  heavy:  { ease: 'elastic.out(1, 0.4)', duration: 1.2 },
  medium: { ease: 'back.out(1.7)', duration: 0.55 },
  light:  { ease: 'power4.out', duration: 0.32 },
} as const;

type Preset = keyof typeof PRESETS;

/**
 * Returns a gsap.quickTo-backed spring animation for a given target+property.
 * Usage:
 *   const springX = useSpring(ref, 'x', 'heavy');
 *   springX(100); // animate to 100 with heavy spring
 */
export function useSpring(
  targetRef: React.RefObject<HTMLElement | gsap.TweenTarget | null>,
  property: string,
  preset: Preset | SpringConfig = 'medium'
) {
  const quickToRef = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  useEffect(() => {
    if (!targetRef.current) return;
    const config = typeof preset === 'string' ? PRESETS[preset] : preset;
    quickToRef.current = gsap.quickTo(targetRef.current, property, {
      duration: config.duration ?? 0.5,
      ease: config.ease ?? 'power4.out',
    });
  }, [targetRef, property, preset]);

  const animate = useCallback((value: number) => {
    quickToRef.current?.(value);
  }, []);

  return animate;
}

export { PRESETS as SPRING_PRESETS };
