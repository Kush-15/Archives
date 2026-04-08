import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Point = { x: number; y: number };

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<Point>({ x: 0, y: 0 });
  const targetRef = useRef<Point>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const layerRef = useRef<HTMLElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [layerReady, setLayerReady] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(any-pointer: fine)');

    const update = () => {
      setEnabled(media.matches);
    };

    update();

    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const layer = document.createElement('div');
    layer.setAttribute('id', 'custom-cursor-layer');
    layer.style.position = 'fixed';
    layer.style.inset = '0';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '9999';
    layer.style.isolation = 'isolate';
    layer.style.overflow = 'hidden';

    document.body.appendChild(layer);
    layerRef.current = layer;
    setLayerReady(true);

    document.body.classList.add('hide-native-cursor');

    const initial = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
    };
    currentRef.current = initial;
    targetRef.current = initial;

    const handleMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      document.body.classList.remove('hide-native-cursor');
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
      setLayerReady(false);
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled) return;
    document.body.classList.remove('hide-native-cursor');
  }, [enabled]);

  if (!enabled || !layerReady || !layerRef.current || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      ref={cursorRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '14px',
        height: '14px',
        marginLeft: '-7px',
        marginTop: '-7px',
        borderRadius: '9999px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        border: '1.5px solid rgba(255, 255, 255, 0.74)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
        pointerEvents: 'none',
        zIndex: 2147483647,
        transform: 'translate3d(-100px, -100px, 0)',
        willChange: 'transform',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          width: '2.5px',
          height: '2.5px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
        }}
      />
    </div>,
    layerRef.current,
  );
}
