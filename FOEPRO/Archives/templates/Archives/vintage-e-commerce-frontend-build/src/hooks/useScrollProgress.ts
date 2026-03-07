import { useEffect, useState, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Returns a normalized 0–1 scroll progress for a given section ref.
 * The section is measured from its top entering the viewport
 * to its bottom leaving the viewport.
 */
export function useScrollProgress(
  sectionRef: React.RefObject<HTMLElement | null>,
  options?: { start?: string; end?: string }
) {
  const [progress, setProgress] = useState(0);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    triggerRef.current = ScrollTrigger.create({
      trigger: el,
      start: options?.start ?? 'top bottom',
      end: options?.end ?? 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        setProgress(self.progress);
      },
    });

    return () => {
      triggerRef.current?.kill();
    };
  }, [sectionRef, options?.start, options?.end]);

  return progress;
}

/**
 * Returns a memoized GSAP ScrollTrigger config generator
 * that components use to create scroll-linked timelines.
 */
export function useScrollConfig(containerRef: React.RefObject<HTMLElement | null>) {
  return useMemo(() => ({
    trigger: containerRef.current,
    scrub: 1.8,
    pin: false,
  }), [containerRef]);
}
