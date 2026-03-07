import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

function CRTIntro({ onComplete }: { onComplete: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      onComplete();
      return;
    }

    const tl = gsap.timeline({ onComplete });
    tl.set(lightRef.current, { scale: 0, opacity: 1 });
    tl.to(lightRef.current, {
      scale: 200,
      duration: 2.0,
      ease: 'power2.inOut',
    });
    tl.to(
      overlayRef.current,
      {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
      },
      '-=0.3'
    );

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div ref={overlayRef} className="crt-overlay">
      <div ref={lightRef} className="crt-light" />
    </div>
  );
}

export default function HeroScene() {
  const [introComplete, setIntroComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!introComplete) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      gsap.set('.hero-headline-line span', { y: 0, opacity: 1 });
      gsap.set(scrollRef.current, { opacity: 1 });
      return;
    }

    gsap.from('.hero-headline-line span', {
      y: 80,
      opacity: 0,
      duration: 0.95,
      stagger: 0.14,
      ease: 'power3.out',
      delay: 0.2,
    });

    gsap.from(scrollRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.8,
      delay: 1.4,
      ease: 'power2.out',
    });

    gsap.fromTo(
      photoRef.current,
      { scale: 1.08, opacity: 0.65 },
      { scale: 1, opacity: 0.95, duration: 1.8, ease: 'power2.out' }
    );
  }, [introComplete]);

  return (
    <section className="hero-act" data-cursor-zone="dark" id="hero">
      {!introComplete && <CRTIntro onComplete={() => setIntroComplete(true)} />}

      <div className="hero-photo-wrap">
        <img
          ref={photoRef}
          className="hero-photo"
          src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2400&q=80"
          alt="Vintage camera in studio lighting"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      <div className="hero-headline">
        <div className="hero-headline-line">
          <span className="typo-hero-light" style={{ fontWeight: 100 }}>
            We are
          </span>
        </div>
        <div className="hero-headline-line hero-headline-line--precision">
          <span className="typo-hero typo-italic">precision</span>
        </div>
        <div className="hero-headline-line">
          <span className="typo-hero-light" style={{ fontWeight: 100 }}>
            We are craft
          </span>
        </div>
      </div>

      <div className="hero-scroll-indicator" ref={scrollRef}>
        <div className="hero-scroll-line" />
      </div>
    </section>
  );
}
