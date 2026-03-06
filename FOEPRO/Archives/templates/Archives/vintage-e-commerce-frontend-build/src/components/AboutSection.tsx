import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const PILLARS = [
  {
    title: 'Provenance & Authenticity',
    body: 'Every camera is traced to its origin — you receive a signed certificate of provenance with every purchase.',
  },
  {
    title: 'Mechanical Restoration',
    body: 'Shutter and aperture mechanisms restored to ISO standards using period-correct lubricants and original manufacturer parts.',
  },
  {
    title: 'Optical Excellence',
    body: 'Lenses cleaned element-by-element in a positive-pressure clean room — fungal remediation and haze removal included.',
  },
  {
    title: 'Archive-Grade Packaging',
    body: 'Each instrument ships in a hand-lined archival box with humidity control and a leather-bound documentation booklet.',
  },
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.about-statement', {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.about-statement', start: 'top 80%' },
      });

      gsap.from('.about-stat', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.about-stats', start: 'top 80%' },
      });

      gsap.from('.about-pillar', {
        y: 25,
        opacity: 0,
        duration: 0.7,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.about-pillars', start: 'top 75%' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="about-section">
      <div className="about-top">
        <p className="about-statement t-section-title">
          The Archives® — 2,400 cameras restored. 40 countries sourced.
          Every instrument documented, every shutter timed.
        </p>

        <div className="about-stats">
          <div className="about-stat">
            <span className="about-stat-key t-eyebrow">Est.</span>
            <span className="about-stat-value t-stat-number">1972</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-key t-eyebrow">Cameras restored</span>
            <span className="about-stat-value t-stat-number">2,400+</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-key t-eyebrow">Countries sourced</span>
            <span className="about-stat-value t-stat-number">40</span>
          </div>
        </div>
      </div>

      <div className="about-pillars">
        {PILLARS.map((pillar, i) => (
          <div
            key={pillar.title}
            className={`about-pillar ${openIndex === i ? 'about-pillar--open' : ''}`}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <div className="about-pillar-header">
              <span className="t-eyebrow">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="about-pillar-title">{pillar.title}</h3>
              <span className="about-pillar-icon">{openIndex === i ? '-' : '+'}</span>
            </div>
            <div className="about-pillar-body">
              <p className="t-body">{pillar.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
