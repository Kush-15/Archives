import { useEffect, useRef, useState } from 'react';

/**
 * Manages a WebGL canvas lifecycle via IntersectionObserver.
 * Returns { inView, canvasRef } — when inView is false,
 * the R3F canvas should use frameloop="never".
 */
export function useInViewCanvas(threshold = 0.05) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { inView, containerRef };
}

/**
 * Imperative check — useful in render props or callbacks.
 */
export function useInViewCallback(
  ref: React.RefObject<HTMLElement | null>,
  callback: (inView: boolean) => void,
  threshold = 0.05
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => callback(entry.isIntersecting),
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, callback, threshold]);
}
