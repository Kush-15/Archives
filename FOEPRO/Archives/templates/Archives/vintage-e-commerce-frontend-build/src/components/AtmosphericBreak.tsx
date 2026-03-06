import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { products } from '@/data/products';

gsap.registerPlugin(ScrollTrigger);

const breakImage = products[2]?.images?.[0] ?? products[0]?.images?.[0] ?? '';

export default function AtmosphericBreak() {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const anim = gsap.to(imgRef.current, {
      yPercent: -20,
      ease: 'none',
      scrollTrigger: {
        trigger: imgRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []);

  return (
    <div className="atm-break">
      <img ref={imgRef} src={breakImage} alt="Archive instrument" className="atm-break-img" />
      <div className="atm-break-overlay" />
      <div className="atm-break-text">
        <p className="t-eyebrow">The Collection</p>
        <h2 className="t-section-title">
          Capture the
          <br />
          Legacy
        </h2>
        <p className="t-body">Capture in clarity</p>
      </div>
    </div>
  );
}
