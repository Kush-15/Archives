import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Loader from '@/components/Loader';
import SiteNav from '@/components/SiteNav';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import AtmosphericBreak from '@/components/AtmosphericBreak';
import CollectionSection from '@/components/CollectionSection';
import CraftsmanshipSection from '@/components/CraftsmanshipSection';
import ArchiveSection from '@/components/ArchiveSection';
import SiteFooter from '@/components/SiteFooter';
import '@/styles/home.css';

gsap.registerPlugin(ScrollTrigger);

export function Home() {
  const [loading, setLoading] = useState(true);

  // Scroll-driven cold→warm theme transition
  useEffect(() => {
    if (loading) return;
    const heroHeight = window.innerHeight;
    const update = () => {
      const progress = Math.min(window.scrollY / heroHeight, 1);
      document.documentElement.style.setProperty(
        '--scroll-progress',
        String(progress.toFixed(3))
      );
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    }
  }, [loading]);

  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="home-shell">
      {loading && <Loader onDone={() => setLoading(false)} />}

      {!loading && (
        <>
          <SiteNav />
          <main>
            <HeroSection />
            <AboutSection />
            <AtmosphericBreak />
            <CollectionSection />
            <CraftsmanshipSection />
            <ArchiveSection />
          </main>
          <SiteFooter />
        </>
      )}
    </div>
  );
}
