import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { usePerformance } from '@/context/PerformanceContext';

/* ═══════════════════════════════════════════════════════════
   THE ARCHIVES — Morphing SVG Blob Cursor
   Pure SVG + GSAP — no canvas, no WebGL, no images.
   ═══════════════════════════════════════════════════════════ */

// ── Accent color from tokens.css ────────────────────────────
const INDIGO = '#5C6EFF';

// ── Color palettes ──────────────────────────────────────────
const DARK_ZONE = {
  stroke: 'rgba(237,232,223,0.55)',
  dot:    'rgba(237,232,223,0.8)',
};
const LIGHT_ZONE = {
  stroke: 'rgba(8,8,9,0.5)',
  dot:    'rgba(8,8,9,0.8)',
};

// ── Mutable animated state ──────────────────────────────────
interface BlobState {
  w: number;
  h: number;
  rx: number;
  strokeO: number;
  fillO: number;
  dotR: number;
}

function createDefaultState(): BlobState {
  return { w: 14, h: 14, rx: 7, strokeO: 0.55, fillO: 0, dotR: 2.5 };
}

// ── Luminance check ─────────────────────────────────────────
function isLightColor(color: string): boolean {
  // Parse rgb/rgba strings
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return false;
  const r = parseInt(match[1]) / 255;
  const g = parseInt(match[2]) / 255;
  const b = parseInt(match[3]) / 255;
  // Relative luminance (sRGB)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5;
}

export default function CustomCursor(): JSX.Element | null {
  // ── Refs ────────────────────────────────────────────────────
  const wrapRef  = useRef<HTMLDivElement>(null);
  const svgRef   = useRef<SVGSVGElement>(null);
  const rectRef  = useRef<SVGRectElement>(null);
  const dotRef   = useRef<SVGCircleElement>(null);

  // Mouse raw & rendered positions
  const rawPos      = useRef({ x: 0, y: 0 });
  const renderedPos = useRef({ x: 0, y: 0 });

  // Lock-on system
  const locked        = useRef(false);
  const lockTarget    = useRef({ x: 0, y: 0 });

  // Mutable animated state — GSAP writes here, RAF reads
  const blob = useRef<BlobState>(createDefaultState());

  // Current stroke/fill color refs (GSAP tweens these strings)
  const strokeColor = useRef('rgba(237,232,223,0.55)');
  const fillColor   = useRef('rgba(237,232,223,0)');
  const dotColor    = useRef('rgba(237,232,223,0.8)');

  // Zone colors (updated on mousemove, not in RAF)
  const zoneColors = useRef(DARK_ZONE);

  // will-change idle timeout
  const willChangeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Touch detection
  const isTouchRef = useRef(false);

  // Performance tier
  const { useCustomCursor } = usePerformance();

  // ── Touch detection ──────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    isTouchRef.current = mq.matches;
    const handler = () => { isTouchRef.current = mq.matches; };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const enabled = useCustomCursor && !isTouchRef.current;

  // ── Hide native cursor ───────────────────────────────────
  useEffect(() => {
    if (enabled) {
      document.body.classList.add('hide-native-cursor');
    } else {
      document.body.classList.remove('hide-native-cursor');
    }
    return () => { document.body.classList.remove('hide-native-cursor'); };
  }, [enabled]);

  // ── Mouse position tracking + zone detection ─────────────
  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      rawPos.current.x = e.clientX;
      rawPos.current.y = e.clientY;

      // will-change management
      if (wrapRef.current) {
        wrapRef.current.style.willChange = 'transform';
      }
      if (willChangeTimer.current) clearTimeout(willChangeTimer.current);
      willChangeTimer.current = setTimeout(() => {
        if (wrapRef.current) wrapRef.current.style.willChange = 'auto';
      }, 2000);

      // Zone detection — check background at cursor position
      try {
        const els = document.elementsFromPoint(e.clientX, e.clientY);
        let foundLight = false;
        for (let i = 0; i < els.length; i++) {
          const el = els[i] as HTMLElement;
          if (!el || el === wrapRef.current || el.closest('.custom-cursor-wrap')) continue;
          const bg = getComputedStyle(el).backgroundColor;
          if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
            if (isLightColor(bg)) {
              foundLight = true;
              break;
            }
          }
        }
        zoneColors.current = foundLight ? LIGHT_ZONE : DARK_ZONE;
      } catch {
        // Fallback to dark zone
        zoneColors.current = DARK_ZONE;
      }
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', onMove);
      if (willChangeTimer.current) clearTimeout(willChangeTimer.current);
    };
  }, [enabled]);

  // ── Cursor show/hide on document enter/leave ─────────────
  useEffect(() => {
    if (!enabled) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onEnter = () => { gsap.to(wrap, { opacity: 1, duration: 0.3 }); };
    const onLeave = () => { gsap.to(wrap, { opacity: 0, duration: 0.3 }); };

    document.body.addEventListener('mouseenter', onEnter);
    document.body.addEventListener('mouseleave', onLeave);
    return () => {
      document.body.removeEventListener('mouseenter', onEnter);
      document.body.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled]);

  // ── Transition functions ─────────────────────────────────
  // These use GSAP to tween the mutable blob ref and color refs.

  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);

  const killTweens = () => {
    tweenRef.current?.kill();
    colorTweenRef.current?.kill();
  };

  const toIdle = () => {
    killTweens();
    locked.current = false;
    const zone = zoneColors.current;

    tweenRef.current = gsap.to(blob.current, {
      w: 14, h: 14, rx: 7,
      strokeO: 0.55, fillO: 0, dotR: 2.5,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: true,
    });

    // Color proxy object for smooth lerp
    const colorProxy = { stroke: strokeColor.current, fill: fillColor.current, dot: dotColor.current };
    colorTweenRef.current = gsap.to(colorProxy, {
      stroke: zone.stroke,
      fill: 'rgba(237,232,223,0)',
      dot: zone.dot,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => {
        strokeColor.current = colorProxy.stroke;
        fillColor.current = colorProxy.fill;
        dotColor.current = colorProxy.dot;
      },
    });
  };

  const toCard = (el: HTMLElement) => {
    killTweens();
    const rect = el.getBoundingClientRect();
    locked.current = true;
    lockTarget.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    tweenRef.current = gsap.to(blob.current, {
      w: rect.width + 20, h: rect.height + 20, rx: 12,
      strokeO: 0.7, fillO: 0, dotR: 0,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: true,
    });

    const zone = zoneColors.current;
    const colorProxy = { stroke: strokeColor.current, fill: fillColor.current, dot: dotColor.current };
    colorTweenRef.current = gsap.to(colorProxy, {
      stroke: `rgba(237,232,223,0.65)`,
      fill: 'rgba(237,232,223,0)',
      dot: zone.dot,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => {
        strokeColor.current = colorProxy.stroke;
        fillColor.current = colorProxy.fill;
        dotColor.current = colorProxy.dot;
      },
    });
  };

  const toButton = (el: HTMLElement) => {
    killTweens();
    const rect = el.getBoundingClientRect();
    locked.current = true;
    lockTarget.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    tweenRef.current = gsap.to(blob.current, {
      w: rect.width + 12, h: rect.height + 12, rx: 3,
      strokeO: 0.9, fillO: 0.08, dotR: 0,
      duration: 0.4,
      ease: 'power3.out',
      overwrite: true,
    });

    const colorProxy = { stroke: strokeColor.current, fill: fillColor.current, dot: dotColor.current };
    colorTweenRef.current = gsap.to(colorProxy, {
      stroke: INDIGO,
      fill: `rgba(92,110,255,0.08)`,
      dot: DARK_ZONE.dot,
      duration: 0.4,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => {
        strokeColor.current = colorProxy.stroke;
        fillColor.current = colorProxy.fill;
        dotColor.current = colorProxy.dot;
      },
    });
  };

  const toPill = (el: HTMLElement) => {
    killTweens();
    const rect = el.getBoundingClientRect();
    locked.current = true;
    lockTarget.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    tweenRef.current = gsap.to(blob.current, {
      w: rect.width + 10, h: rect.height + 10, rx: 50,
      strokeO: 0.8, fillO: 0, dotR: 0,
      duration: 0.38,
      ease: 'power3.out',
      overwrite: true,
    });

    const colorProxy = { stroke: strokeColor.current, fill: fillColor.current, dot: dotColor.current };
    colorTweenRef.current = gsap.to(colorProxy, {
      stroke: 'rgba(237,232,223,0.7)',
      fill: 'rgba(237,232,223,0)',
      dot: DARK_ZONE.dot,
      duration: 0.38,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: () => {
        strokeColor.current = colorProxy.stroke;
        fillColor.current = colorProxy.fill;
        dotColor.current = colorProxy.dot;
      },
    });
  };

  const toModel = () => {
    killTweens();
    locked.current = false; // follows cursor freely

    tweenRef.current = gsap.to(blob.current, {
      w: 60, h: 60, rx: 30,
      strokeO: 0.7, fillO: 0.04, dotR: 0,
      duration: 0.5,
      ease: 'back.out(1.4)',
      overwrite: true,
    });

    const colorProxy = { stroke: strokeColor.current, fill: fillColor.current, dot: dotColor.current };
    colorTweenRef.current = gsap.to(colorProxy, {
      stroke: INDIGO,
      fill: `rgba(92,110,255,0.04)`,
      dot: DARK_ZONE.dot,
      duration: 0.5,
      ease: 'back.out(1.4)',
      overwrite: true,
      onUpdate: () => {
        strokeColor.current = colorProxy.stroke;
        fillColor.current = colorProxy.fill;
        dotColor.current = colorProxy.dot;
      },
    });
  };

  // Store transition functions in a ref so the event listener effect
  // can access the latest versions without re-attaching.
  const transitionsRef = useRef({ toIdle, toCard, toButton, toPill, toModel });
  transitionsRef.current = { toIdle, toCard, toButton, toPill, toModel };

  // ── data-cursor event listeners ──────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handlers = new Map<HTMLElement, { enter: () => void; leave: () => void }>();

    const attach = () => {
      const elements = document.querySelectorAll<HTMLElement>('[data-cursor]');
      elements.forEach((el) => {
        const type = el.dataset.cursor;
        const enter = () => {
          switch (type) {
            case 'card':    transitionsRef.current.toCard(el); break;
            case 'button':  transitionsRef.current.toButton(el); break;
            case 'pill':    transitionsRef.current.toPill(el); break;
            case 'model':   transitionsRef.current.toModel(); break;
            default:        break;
          }
        };
        const leave = () => { transitionsRef.current.toIdle(); };
        el.addEventListener('mouseenter', enter);
        el.addEventListener('mouseleave', leave);
        handlers.set(el, { enter, leave });
      });
    };

    // Initial attachment
    attach();

    // Re-scan on DOM mutations (covers route changes, dynamic content)
    const observer = new MutationObserver(() => {
      // Detach old
      handlers.forEach(({ enter, leave }, el) => {
        el.removeEventListener('mouseenter', enter);
        el.removeEventListener('mouseleave', leave);
      });
      handlers.clear();
      // Re-attach
      attach();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      handlers.forEach(({ enter, leave }, el) => {
        el.removeEventListener('mouseenter', enter);
        el.removeEventListener('mouseleave', leave);
      });
      handlers.clear();
    };
  }, [enabled]);

  // ── RAF loop ─────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    let rafId: number;

    const loop = () => {
      const b = blob.current;
      const rp = rawPos.current;
      const rd = renderedPos.current;

      // Lerp speed: 0.16 idle, 0.12 locked
      const speed = locked.current ? 0.12 : 0.16;

      // Target position: lock target or raw mouse
      const tx = locked.current ? lockTarget.current.x : rp.x;
      const ty = locked.current ? lockTarget.current.y : rp.y;

      rd.x += (tx - rd.x) * speed;
      rd.y += (ty - rd.y) * speed;

      // Update wrapper position
      const wrap = wrapRef.current;
      if (wrap) {
        wrap.style.transform = `translate3d(${rd.x}px, ${rd.y}px, 0)`;
      }

      // Update SVG dimensions and viewBox
      const svg = svgRef.current;
      if (svg) {
        const w = b.w;
        const h = b.h;
        svg.setAttribute('width', String(w));
        svg.setAttribute('height', String(h));
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }

      // Update rect
      const rect = rectRef.current;
      if (rect) {
        rect.setAttribute('x', '0.75');
        rect.setAttribute('y', '0.75');
        rect.setAttribute('width', String(Math.max(0, b.w - 1.5)));
        rect.setAttribute('height', String(Math.max(0, b.h - 1.5)));
        rect.setAttribute('rx', String(b.rx));
        rect.setAttribute('ry', String(b.rx));
        rect.setAttribute('stroke', strokeColor.current);
        rect.setAttribute('stroke-opacity', String(b.strokeO));
        rect.setAttribute('fill', fillColor.current);
        rect.setAttribute('fill-opacity', String(b.fillO));
      }

      // Update dot
      const dot = dotRef.current;
      if (dot) {
        dot.setAttribute('cx', String(b.w / 2));
        dot.setAttribute('cy', String(b.h / 2));
        dot.setAttribute('r', String(b.dotR));
        dot.setAttribute('fill', dotColor.current);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    // Pause when tab not visible
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled]);

  // ── Early return for disabled states ─────────────────────
  if (!enabled) return null;

  return (
    <div
      ref={wrapRef}
      className="custom-cursor-wrap"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
        // Center the SVG on the cursor position
        transform: 'translate3d(0px, 0px, 0)',
      }}
    >
      <svg
        ref={svgRef}
        width="14"
        height="14"
        viewBox="0 0 14 14"
        overflow="visible"
        style={{
          display: 'block',
          // Offset so the center of the SVG is at the cursor point
          transform: 'translate(-50%, -50%)',
        }}
      >
        <rect
          ref={rectRef}
          x="0.75"
          y="0.75"
          width="12.5"
          height="12.5"
          rx="7"
          ry="7"
          fill="rgba(237,232,223,0)"
          fillOpacity={0}
          stroke="rgba(237,232,223,0.55)"
          strokeOpacity={0.55}
          strokeWidth="1.5"
        />
        <circle
          ref={dotRef}
          cx="7"
          cy="7"
          r="2.5"
          fill="rgba(237,232,223,0.8)"
        />
      </svg>
    </div>
  );
}
