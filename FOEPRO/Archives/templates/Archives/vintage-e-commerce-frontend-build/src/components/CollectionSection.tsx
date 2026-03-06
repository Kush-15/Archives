import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { products } from '@/data/products';

gsap.registerPlugin(ScrollTrigger);

const CAMERAS = [
  {
    brand: 'Olympus',
    model: 'OM-1',
    year: 1972,
    image: products[2]?.images?.[0] ?? products[0]?.images?.[0] ?? '',
    specs: {
      'Film Format': '35mm',
      'Shutter Speed': '1s - 1/1000s',
      Metering: 'TTL Open-Aperture',
      Viewfinder: '97% Coverage',
      Weight: '510g Body Only',
      Mount: 'Olympus OM System',
    },
    blueprint: true,
  },
  {
    brand: 'Leica',
    model: 'M6',
    year: 1984,
    image: products[1]?.images?.[0] ?? products[0]?.images?.[0] ?? '',
    specs: {
      'Film Format': '35mm',
      'Shutter Speed': '1s - 1/1000s',
      Metering: 'TTL Selective',
      Viewfinder: '0.72x Magnification',
      Weight: '560g Body Only',
      Mount: 'Leica M Bayonet',
    },
    blueprint: false,
  },
];

export default function CollectionSection() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const xrayRef = useRef<HTMLImageElement>(null);
  const cam = CAMERAS[active];

  useEffect(() => {
    if (!xrayRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        xrayRef.current,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            end: 'center 40%',
            scrub: 1.5,
          },
        }
      );

      gsap.from('.collection-title-word', {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
      });

      gsap.from('.spec-row', {
        x: -20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.07,
        scrollTrigger: { trigger: '.spec-table', start: 'top 80%' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [active]);

  return (
    <section id="collection" ref={sectionRef} className="collection-section">
      <div className="collection-title-block">
        <div className="collection-title-left">
          <p className="t-eyebrow collection-title-word">The Instrument</p>
          <h2 className="t-section-title">
            <span className="collection-title-word">Archive the</span>
            <br />
            <span className="collection-title-word collection-title-italic">Legacy</span>
          </h2>
        </div>
        <div className="collection-title-right">
          <h3 className="collection-subtitle collection-title-word">Capture in</h3>
          <h3 className="collection-subtitle collection-title-word collection-title-italic">Clarity</h3>
        </div>
      </div>

      <div className="collection-tabs">
        {CAMERAS.map((camera, i) => (
          <button
            key={camera.model}
            className={`collection-tab ${active === i ? 'collection-tab--active' : ''}`}
            onClick={() => setActive(i)}
          >
            {camera.brand} {camera.model}
          </button>
        ))}
      </div>

      <div className="collection-body">
        <div className="collection-specs">
          <div className="collection-brand-block">
            <p className="t-eyebrow">{cam.brand}</p>
            <h3 className="collection-model-name">{cam.model}</h3>
            <p className="t-body collection-model-desc">
              The {cam.brand} {cam.model} — a pinnacle of {cam.year}s mechanical engineering, machined from a single aluminium block.
            </p>
          </div>

          <div className="spec-table">
            {Object.entries(cam.specs).map(([k, v]) => (
              <div key={k} className="spec-row">
                <span className="spec-key t-eyebrow">{k}</span>
                <span className="spec-val">{v}</span>
              </div>
            ))}
          </div>

          <a href="/catalog" className="btn-primary">
            View in Collection {'->'}
          </a>
        </div>

        <div className="collection-image-panel">
          <img src={cam.image} alt={`${cam.brand} ${cam.model}`} className="collection-camera-img" />
          {cam.blueprint && (
            <img
              ref={xrayRef}
              src={cam.image}
              alt="Camera X-ray blueprint"
              className="collection-xray-img"
            />
          )}
          <div className="collection-scanline" />

          <p className="collection-img-caption t-eyebrow">
            {cam.brand} - {cam.model} - {cam.year}
          </p>
        </div>
      </div>
    </section>
  );
}
