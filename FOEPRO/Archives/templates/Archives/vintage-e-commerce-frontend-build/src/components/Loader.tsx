import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface LoaderProps {
  onDone: () => void;
}

const LENS_URL =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2400&q=80';
const LENS_FALLBACK =
  'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?w=800';

const PREFETCH = [
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2400&q=80',
  'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=2200&q=80',
];

const MIN_MS = 2200;

export default function Loader({ onDone }: LoaderProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const exiting = useRef(false);
  const rafId = useRef(0);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const startTime = Date.now();
    let assetsReady = false;
    let lensReady = false;

    const imgEl = imgRef.current!;
    const overlayEl = overlayRef.current!;

    overlayEl.style.setProperty('--hole', '0px');
    overlayEl.style.setProperty(
      'mask-image',
      'radial-gradient(circle at 50% 50%, transparent var(--hole), black calc(var(--hole) + 1px))'
    );
    overlayEl.style.setProperty(
      '-webkit-mask-image',
      'radial-gradient(circle at 50% 50%, transparent var(--hole), black calc(var(--hole) + 1px))'
    );
    overlayEl.style.setProperty('mask-repeat', 'no-repeat');
    overlayEl.style.setProperty('-webkit-mask-repeat', 'no-repeat');

    // Gate animation on lens image load
    const onLensLoad = () => { lensReady = true; };
    imgEl.addEventListener('load', onLensLoad, { once: true });
    imgEl.addEventListener('error', () => {
      imgEl.src = LENS_FALLBACK;
      imgEl.addEventListener('load', onLensLoad, { once: true });
      imgEl.addEventListener('error', onLensLoad, { once: true });
    }, { once: true });
    imgEl.src = LENS_URL;

    // Prefetch site images
    const siteLoads = PREFETCH.map(
      (src) =>
        new Promise<void>((r) => {
          const i = new Image();
          i.onload = i.onerror = () => r();
          i.src = src;
        })
    );

    const timer = new Promise<void>((r) => setTimeout(r, MIN_MS));

    Promise.all([...siteLoads, timer]).then(() => {
      assetsReady = true;
    });

    // ── Single RAF loop ──
    const tick = () => {
      if (!lensReady) {
        rafId.current = requestAnimationFrame(tick);
        return;
      }

      const elapsed = Date.now() - startTime;
      const timeProgress = Math.min((elapsed / MIN_MS) * 100, 100);
      const assetProgress = assetsReady ? 100 : Math.min(timeProgress, 85);
      const progress = Math.min(timeProgress, assetProgress);

      // clip-path reveal: 8% → 50%
      const reveal = 8 + Math.sqrt(progress / 100) * 42;
      imgEl.style.setProperty('--reveal', `${reveal}%`);

      // Percentage
      if (percentRef.current) {
        percentRef.current.textContent = String(Math.round(progress));
      }

      // Bar fill
      if (fillRef.current) {
        fillRef.current.style.width = `${progress}%`;
      }

      if (progress >= 100) {
        exitSequence();
        return;
      }

      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    const exitSequence = () => {
      if (exiting.current) return;
      exiting.current = true;

      // Fade loader HUD and lens quickly.
      gsap.to([imgEl, percentRef.current, fillRef.current?.parentElement], {
        opacity: 0,
        duration: 0.22,
        ease: 'power2.out',
      });

      // Circular opening reveal to uncover the site.
      gsap.to(overlayEl, {
        '--hole': '160vmax',
        duration: 0.72,
        ease: 'power3.inOut',
        onComplete: () => {
          onDone();
        },
      } as gsap.TweenVars);
    };

    return () => {
      cancelAnimationFrame(rafId.current);
      started.current = false;
    };
  }, [onDone]);

  /* ── all styles inline, self-contained ── */

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Lens image — clip-path driven reveal */}
      <img
        ref={imgRef}
        alt=""
        loading="eager"
        fetchPriority="high"
        decoding="async"
        style={{
          width: 'min(480px, 80vw)',
          height: 'min(480px, 80vw)',
          objectFit: 'cover',
          borderRadius: '50%',
          clipPath: 'circle(var(--reveal, 8%) at 50% 50%)',
          willChange: 'clip-path',
        }}
      />

      {/* Percentage */}
      <span
        ref={percentRef}
        style={{
          marginTop: '2rem',
          fontFamily: "'DM Mono', 'Courier New', monospace",
          fontSize: '2rem',
          letterSpacing: '0.1em',
          color: '#F8F7F4',
          pointerEvents: 'none',
        }}
      >
        0
      </span>

      {/* Progress bar */}
      <div
        style={{
          marginTop: '1rem',
          width: 240,
          height: 1,
          background: '#1A1A1A',
          overflow: 'hidden',
        }}
      >
        <div
          ref={fillRef}
          style={{
            width: '0%',
            height: '100%',
            background: '#5C6EFF',
          }}
        />
      </div>
    </div>
  );
}
