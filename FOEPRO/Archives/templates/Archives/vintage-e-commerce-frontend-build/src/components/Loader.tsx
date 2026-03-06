import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const PHRASES: [number, number, string][] = [
  [0, 5, 'Winding the tape...'],
  [6, 15, 'Cleaning vacuum tubes...'],
  [16, 30, 'Tuning the signal...'],
  [31, 50, 'Warming cathode rays...'],
  [51, 70, 'Polishing the chrome...'],
  [71, 85, 'Aligning the dials...'],
  [86, 97, 'Finalising the crackle...'],
  [98, 100, 'Antenna up - enjoy the show.'],
];

interface LoaderProps {
  onDone: () => void;
}

export default function Loader({ onDone }: LoaderProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const getPhrase = (n: number) => PHRASES.find(([lo, hi]) => n >= lo && n <= hi)?.[2] ?? '';

    if (reducedMotion) {
      if (countRef.current) countRef.current.textContent = '100';
      if (barRef.current) barRef.current.style.transform = 'scaleX(1)';
      onDone();
      return;
    }

    const counter = { val: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: 'power2.inOut',
          onComplete: onDone,
        });
      },
    });

    tl.to(counter, {
      val: 100,
      duration: 2.4,
      ease: 'power1.inOut',
      onUpdate() {
        const v = Math.round(counter.val);
        if (countRef.current) countRef.current.textContent = String(v);
        if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`;

        const phrase = getPhrase(v);
        if (phraseRef.current && phraseRef.current.textContent !== phrase) {
          gsap.to(phraseRef.current, {
            opacity: 0,
            y: -6,
            duration: 0.15,
            onComplete() {
              if (phraseRef.current) phraseRef.current.textContent = phrase;
              gsap.to(phraseRef.current, { opacity: 1, y: 0, duration: 0.2 });
            },
          });
        }
      },
    });

    return () => {
      tl.kill();
    };
  }, [onDone]);

  return (
    <div ref={overlayRef} className="loader">
      <div className="loader-inner">
        <span className="loader-count" ref={countRef}>
          0
        </span>
        <span className="loader-phrase" ref={phraseRef}>
          Winding the tape...
        </span>
      </div>
      <div className="loader-bar-track">
        <div className="loader-bar" ref={barRef} />
      </div>
    </div>
  );
}
