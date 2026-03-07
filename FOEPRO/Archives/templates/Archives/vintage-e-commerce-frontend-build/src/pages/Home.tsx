import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '@/context/AuthContext';
import SiteNav from '@/components/ui/SiteNav';
import HeroScene from '../components/scenes/HeroScene';
import RevealScene from '../components/scenes/RevealScene';
import CollectionScene from '@/components/scenes/CollectionScene';
import CraftsmanshipStation, { STATIONS } from '@/components/ui/CraftsmanshipStation';
import ArchivePanel from '@/components/scenes/ArchivePanel';
import '@/styles/home-new.css';

gsap.registerPlugin(ScrollTrigger);

function WelcomeBand() {
  const { user, isLoggedIn } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, [isLoggedIn]);

  if (!isLoggedIn || !user) return null;

  const name = user.name || user.email.split('@')[0];

  return (
    <div className={`welcome-band${visible ? ' welcome-band--visible' : ''}`}>
      <span className="typo-label" style={{ color: 'var(--arc-text-muted)' }}>
        Welcome back, <em style={{ color: 'var(--arc-text-light)', fontStyle: 'normal' }}>{name}</em>.
      </span>
      <a href="/catalog" className="welcome-band-cta typo-label">
        Continue browsing →
      </a>
    </div>
  );
}

gsap.registerPlugin(ScrollTrigger);

export function Home() {
  const craftRef = useRef<HTMLDivElement>(null);
  const craftTrackRef = useRef<HTMLDivElement>(null);

  // Master GSAP context — all ScrollTriggers live here
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Act IV — horizontal scroll driven by vertical scroll
      if (craftRef.current && craftTrackRef.current) {
        const getDistance = () => {
          return Math.max(0, craftTrackRef.current!.scrollWidth - window.innerWidth);
        };

        gsap.to(craftTrackRef.current, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: craftRef.current,
            start: 'top top',
            end: () => `+=${getDistance()}`,
            pin: true,
            scrub: 1.8,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      }

      // Refresh after layout settles
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div className="archives-home">
      <SiteNav />

      <main>
        {/* ACT I — The Arrival */}
        <HeroScene />

        {/* Personalisation band — only renders when logged in */}
        <WelcomeBand />

        {/* ACT II — The Reveal (scroll-driven disassembly) */}
        <RevealScene />

        {/* ACT III — The Collection */}
        <CollectionScene />

        {/* ACT IV — The Craftsmanship (horizontal scroll) */}
        <section
          ref={craftRef}
          className="craft-act"
          id="craftsmanship"
          data-cursor-zone="light"
        >
          <div className="craft-sticky">
            <div ref={craftTrackRef} className="craft-track">
              {STATIONS.map((station) => (
                <CraftsmanshipStation key={station.number} station={station} />
              ))}
            </div>
          </div>
        </section>

        {/* ACT V — The Archive */}
        <ArchivePanel />
      </main>

      {/* Footer CTA */}
      <footer
        style={{
          background: '#111111',
          color: '#F8F7F4',
          padding: '6rem 6vw',
          textAlign: 'center',
          borderTop: '1px solid rgba(248, 247, 244, 0.08)',
        }}
        data-cursor-zone="dark"
      >
        <div className="typo-label" style={{ opacity: 0.4, marginBottom: '2rem' }}>
          Begin your collection
        </div>
        <h2
          className="footer-hero-copy"
          style={{ margin: '0 auto 2.5rem' }}
        >
          Every camera has a story. <em>Find yours.</em>
        </h2>
        <a
          href="/catalog"
          style={{
            display: 'inline-block',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#ffffff',
            background: '#5C6EFF',
            padding: '1rem 2.5rem',
            border: 'none',
            textDecoration: 'none',
            transition: 'all 0.3s ease',
          }}
        >
          Enter the Shop →
        </a>
        <div
          style={{
            marginTop: '5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.55rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            opacity: 0.3,
          }}
        >
          © {new Date().getFullYear()} The Archives. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
