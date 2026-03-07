import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function RevealScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=180%',
      pin: sticky,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 1.8,
      onUpdate: (self) => {
        setProgress(self.progress);
      },
      invalidateOnRefresh: true,
    });

    return () => trigger.kill();
  }, []);

  const t = progress <= 0.5 ? progress * 2 : (1 - progress) * 2;
  const explode = gsap.utils.interpolate(0, 1, t);

  const bgShade = Math.round(gsap.utils.interpolate(10, 248, t));
  const textColor = '#F8F7F4';

  const transformStyle = {
    transform: `translate3d(${explode * 18}px, ${explode * -8}px, 0) scale(${1 + explode * 0.03})`,
  };

  return (
    <section
      ref={sectionRef}
      className="reveal-act"
      id="reveal"
      data-cursor-zone="dark"
    >
      <div
        ref={stickyRef}
        className="reveal-sticky"
        style={{ background: `rgb(${bgShade}, ${bgShade}, ${bgShade})` }}
      >
        <div className="reveal-image-stage">
          <img
            className="reveal-image reveal-image--base"
            src="https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=2200&q=80"
            alt="Vintage camera body"
            style={transformStyle}
          />
        </div>

        <div className="reveal-labels" style={{ ...transformStyle, color: textColor, opacity: t > 0.2 ? 1 : 0 }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {/* Lens annotation */}
            <line x1="66%" y1="47%" x2="74%" y2="36%" className="reveal-label-line" />
            {/* Body annotation */}
            <line x1="60%" y1="62%" x2="74%" y2="48%" className="reveal-label-line" />
            {/* Shutter/top-plate annotation */}
            <line x1="60%" y1="22%" x2="74%" y2="24%" className="reveal-label-line" />
          </svg>

          <div className="reveal-label" style={{ left: '74%', top: '24%', opacity: t > 0.3 ? 1 : 0 }}>
            <span className="reveal-label-text">Mechanical focal-plane — 1/1000s max</span>
          </div>
          <div className="reveal-label" style={{ left: '74%', top: '36%', opacity: t > 0.45 ? 1 : 0 }}>
            <span className="reveal-label-text">ZUIKO 50mm f/1.4 — 7 elements in 6 groups</span>
          </div>
          <div className="reveal-label" style={{ left: '74%', top: '48%', opacity: t > 0.38 ? 1 : 0 }}>
            <span className="reveal-label-text">OM-1 — 1972 — Aluminium alloy, 510g</span>
          </div>
        </div>

        <div className="reveal-copy" style={{ color: textColor, opacity: t > 0.15 ? 1 : 0 }}>
          <div className="typo-label" style={{ marginBottom: '1.5rem', opacity: 0.7, fontSize: '0.75rem' }}>
            The Anatomy
          </div>
          <div className="typo-section">
            Every component<br />
            <em>has a purpose</em>
          </div>
          <p className="reveal-copy-note typo-mono-lg">
            Labels identify three critical systems: optical formula, shutter mechanics,
            and chassis construction. Together they explain why this body still performs
            with modern precision.
          </p>
        </div>
      </div>
    </section>
  );
}
