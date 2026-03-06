import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { products } from '@/data/products';

const TVFrame = products[0]?.images?.[0] ?? '';
const CameraImg = products[1]?.images?.[0] ?? TVFrame;

export default function HeroSection() {
  const heroImgRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLImageElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });
    tl.from('.hero-bg', { opacity: 0, duration: 1.2, ease: 'power2.out' })
      .from('.hero-image-cluster', {
        x: 80, opacity: 0,
        duration: 1.4, ease: 'power3.out'
      }, '-=1.0')
      .from('.hero-img-camera', {
        scale: 0.94, opacity: 0,
        duration: 1.2, ease: 'power3.out'
      }, '-=1.0')
      .from('.hero-line', { opacity: 0, y: 30, duration: 0.8, stagger: 0.15, ease: 'power3.out' }, '-=0.6')
      .from('.hero-scroll-cta', { opacity: 0, y: 10, duration: 0.5 }, '-=0.2');

    const onMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - window.innerWidth  / 2) / (window.innerWidth  / 2);
      const dy = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);

      gsap.to(heroImgRef.current, {
        x: dx * -22, y: dy * -14,
        duration: 1.6, ease: 'power2.out'
      });

      gsap.to('.hero-img-camera', {
        x: dx * -12, y: dy * -8,
        duration: 1.2, ease: 'power2.out'
      });

      gsap.to(textRef.current, {
        x: dx * 6, y: dy * 4,
        duration: 1.8, ease: 'power2.out'
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => {
      tl.kill();
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-vignette" />
        <div className="hero-grain" />
      </div>

      {/* Right-side hero image cluster */}
      <div className="hero-image-cluster" ref={heroImgRef}>
        <div className="hero-img-glow" />
        <img
          src={TVFrame}
          alt=""
          aria-hidden="true"
          className="hero-img-tv"
        />
        <img
          ref={cameraRef}
          src={CameraImg}
          alt="Vintage film camera"
          className="hero-img-camera"
        />
      </div>

      <div className="hero-text" ref={textRef}>
        <p className="t-eyebrow hero-line">The Archives - Est. 1972</p>
        <h1 className="t-hero">
          <span className="hero-line">We are</span>
          <span className="hero-line hero-italic">precision</span>
          <span className="hero-line">We are craft</span>
        </h1>
      </div>

      <a href="#about" className="hero-scroll-cta">
        <span className="hero-scroll-label">Scroll to explore</span>
        <span className="hero-scroll-sub">To enter the archive</span>
        <div className="hero-scroll-line" />
      </a>
    </section>
  );
}
