import { useEffect, useState } from 'react';
import gsap from 'gsap';

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    gsap.from('.nav-link', {
      y: -20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.3,
    });
  }, []);

  return (
    <nav className={`site-nav ${scrolled ? 'site-nav--scrolled' : ''}`}>
      <div className="nav-brand">
        <span className="nav-brand-eyebrow">EST. 1972</span>
        <span className="nav-brand-name">The Archives</span>
      </div>

      <div className="nav-links">
        <a href="#about" className="nav-link">
          About
        </a>
        <a href="#collection" className="nav-link">
          Collection
        </a>
        <a href="#craftsmanship" className="nav-link">
          Craftsmanship
        </a>
        <a href="#global" className="nav-link">
          Archive
        </a>
      </div>

      <div className="nav-right">
        <a href="/catalog" className="nav-cta">
          Enter the Shop {'->'}
        </a>
      </div>
    </nav>
  );
}
