import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { usePerformance } from '@/context/PerformanceContext';

interface HeroSceneProps {
  startAnimation?: boolean;
}

const HERO_IMAGE_URLS = {
  low:    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=60',
  medium: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=75',
  high:   'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2400&q=80',
};

export default function HeroScene({ startAnimation = true }: HeroSceneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const hasAnimated = useRef(false);

  const { tier, useHeavyAnimations, reducedMotion } = usePerformance();
  const imgSrc = HERO_IMAGE_URLS[tier];

  useEffect(() => {
    if (!startAnimation) {
      gsap.set('.hero-headline-line span', { y: 80, opacity: 0 });
      gsap.set(scrollRef.current, { opacity: 0, y: 20 });
      gsap.set(photoRef.current, { scale: 1.08, opacity: 0.65 });
      return;
    }

    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // Low tier or reduced-motion: skip GSAP, set final state immediately
    if (!useHeavyAnimations || reducedMotion) {
      gsap.set('.hero-headline-line span', { y: 0, opacity: 1 });
      gsap.set(scrollRef.current, { opacity: 1, y: 0 });
      gsap.set(photoRef.current, { scale: 1, opacity: 0.95 });
      return;
    }

    if (tier === 'medium') {
      // Faster, simplified animation for medium tier
      gsap.to('.hero-headline-line span', {
        y: 0,
        opacity: 1,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
        delay: 0.1,
        overwrite: 'auto',
      });

      gsap.to(scrollRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: 0.6,
        ease: 'power2.out',
        overwrite: 'auto',
      });

      gsap.fromTo(
        photoRef.current,
        { scale: 1.04, opacity: 0.7 },
        { scale: 1, opacity: 0.95, duration: 1.0, ease: 'power2.out' }
      );
      return;
    }

    // High tier — full experience
    gsap.to('.hero-headline-line span', {
      y: 0,
      opacity: 1,
      duration: 0.95,
      stagger: 0.14,
      ease: 'power3.out',
      delay: 0.2,
      overwrite: 'auto',
    });

    gsap.to(scrollRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: 1.1,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    gsap.fromTo(
      photoRef.current,
      { scale: 1.08, opacity: 0.65 },
      { scale: 1, opacity: 0.95, duration: 1.8, ease: 'power2.out' }
    );
  }, [startAnimation, tier, useHeavyAnimations, reducedMotion]);

  return (
    <section className="hero-act" data-cursor-zone="dark" id="hero">
      <div className="hero-photo-wrap">
        <img
          ref={photoRef}
          className="hero-photo"
          src={imgSrc}
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
        <div className="hero-scroll-dot" />
        <div className="hero-scroll-line" />
      </div>
    </section>
  );
}
