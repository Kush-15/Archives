import { useEffect, useState, lazy, Suspense } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SiteNav from '@/components/ui/SiteNav';
import HeroScene from '../components/scenes/HeroScene';
import RevealScene from '../components/scenes/RevealScene';
import { MessageCircle, Camera, X as XIcon } from 'lucide-react';
const CollectionScene = lazy(() => import('@/components/scenes/CollectionScene'));
import CraftsmanshipStack, { STATIONS } from '@/components/ui/CraftsmanshipStation';
import Loader from '@/components/Loader';
import { usePerformance } from '@/context/PerformanceContext';
import '@/styles/home-new.css';

gsap.registerPlugin(ScrollTrigger);

interface HomeProps {
  onSearchClick?: () => void;
}

export function Home({ onSearchClick }: HomeProps = {}) {
  const { tier, useLoader } = usePerformance();

  // On low tier, skip the loader entirely — start as not-loading
  const [loading, setLoading] = useState(() => useLoader);

  // Refresh ScrollTrigger after layout settles
  useEffect(() => {
    if (loading) return;
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [loading]);

  return (
    <>
      {loading && <Loader onDone={() => setLoading(false)} tier={tier} />}
      <div className="archives-home">
      <SiteNav onSearchClick={onSearchClick} />

      <main>
        {/* ACT I — The Arrival */}
        <HeroScene startAnimation={!loading} />

        {/* ACT II — The Reveal (scroll-driven disassembly) */}
        <RevealScene />

        {/* ACT III — The Collection (3D on medium/high; static poster on low) */}
        <Suspense fallback={
          <div className="py-32 flex items-center justify-center bg-[#0a0a0a]">
            <p className="font-mono text-xs uppercase tracking-widest text-archive-muted">Loading Collection Scene...</p>
          </div>
        }>
          <CollectionScene />
        </Suspense>

        {/* ACT IV — The Craftsmanship (scattered card stack) */}
        <CraftsmanshipStack stations={STATIONS} />
      </main>

      {/* Footer CTA */}
      <footer className="footer-cta-section" data-cursor-zone="dark">
        {/* SVG noise grain (Layer 3) */}
        <svg className="footer-cta-noise" aria-hidden="true">
          <filter id="footerNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#footerNoise)" />
        </svg>

        <div className="footer-cta-content">
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
            className="footer-cta-btn"
            data-cursor="magnetic"
            data-cursor-label="SHOP"
          >
            Enter the Shop
            <span className="footer-cta-btn-arrow">→</span>
          </a>
          <div
            style={{
              marginTop: '5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.55rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              opacity: 0.3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <span>© {new Date().getFullYear()} The Archives. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
              <a
                href="https://discord.gg/p89YbDMWZ"
                target="_blank"
                rel="noreferrer"
                aria-label="Discord"
                style={{
                  color: 'inherit',
                  width: '1.85rem',
                  height: '1.85rem',
                  border: '1px solid rgba(248, 247, 244, 0.35)',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageCircle size={14} strokeWidth={1.8} />
              </a>
              <a
                href="https://ig.me/j/AbaYv6JEmEqmzJsm/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                style={{
                  color: 'inherit',
                  width: '1.85rem',
                  height: '1.85rem',
                  border: '1px solid rgba(248, 247, 244, 0.35)',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Camera size={14} strokeWidth={1.8} />
              </a>
              <span
                aria-label="LinkedIn placeholder"
                title="LinkedIn"
                style={{
                  color: 'inherit',
                  width: '1.85rem',
                  height: '1.85rem',
                  border: '1px solid rgba(248, 247, 244, 0.2)',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: 1 }}>in</span>
              </span>
              <span
                aria-label="X placeholder"
                title="X"
                style={{
                  color: 'inherit',
                  width: '1.85rem',
                  height: '1.85rem',
                  border: '1px solid rgba(248, 247, 244, 0.2)',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.6,
                }}
              >
                <XIcon size={14} strokeWidth={1.8} />
              </span>
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <a href="/terms" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px solid currentColor', paddingBottom: '1px' }}>Terms &amp; Conditions</a>
              <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px solid currentColor', paddingBottom: '1px' }}>Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
