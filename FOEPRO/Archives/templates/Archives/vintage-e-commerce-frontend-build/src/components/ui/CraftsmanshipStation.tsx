import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface StationData {
  number: string;
  label: string;
  title: string;
  body: string;
}

/* ── Slot definitions ── */
const SLOTS = {
  CENTER:     { x: 0,    y: 0,   rotation: 0,   scale: 1,    opacity: 1,    zIndex: 10 },
  LEFT_FAR:   { x: -520, y: 36,  rotation: -12, scale: 0.84, opacity: 0.42, zIndex: 4  },
  LEFT_NEAR:  { x: -270, y: 18,  rotation: -6,  scale: 0.92, opacity: 0.72, zIndex: 6  },
  RIGHT_NEAR: { x: 270,  y: 24,  rotation: 7,   scale: 0.92, opacity: 0.72, zIndex: 6  },
};

/* Per-card micro-rotation offsets */
const MICRO_OFFSETS = [1.5, -1, 2, -0.8];

const REVIEWERS = [
  { name: 'Mara Ito', role: 'Collector, Tokyo', initials: 'MI' },
  { name: 'Elias Roy', role: 'Art Director, Paris', initials: 'ER' },
  { name: 'Nora Hale', role: 'Photo Archivist, NYC', initials: 'NH' },
  { name: 'Theo Park', role: 'Studio Founder, Seoul', initials: 'TP' },
];

/* Given an activeIndex, return which slot each card occupies */
function getSlotAssignment(activeIndex: number, totalCards: number) {
  const order = ['LEFT_FAR', 'LEFT_NEAR', 'CENTER', 'RIGHT_NEAR'] as const;
  // Build a circular mapping: active card gets CENTER (index 2 in order)
  const assignments: (keyof typeof SLOTS)[] = [];
  for (let i = 0; i < totalCards; i++) {
    const offset = ((i - activeIndex) % totalCards + totalCards) % totalCards;
    // offset 0 = active → CENTER, 1 → RIGHT_NEAR, 2 → LEFT_FAR, 3 → LEFT_NEAR
    const mapping = [2, 3, 0, 1]; // offset → order index
    assignments.push(order[mapping[offset]]);
  }
  return assignments;
}

/* ── Main component ── */
export default function CraftsmanshipStack({ stations }: { stations: StationData[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepNumRef = useRef<HTMLSpanElement>(null);
  const isAnimating = useRef(false);
  const isDragging = useRef(false);
  const prevIndex = useRef(0);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);
  const dragCard = useRef<HTMLDivElement | null>(null);
  const dragIndex = useRef<number | null>(null);

  const totalCards = stations.length;

  /* ── Animate cards to slots ── */
  const animateToIndex = useCallback((newIndex: number) => {
    if (isAnimating.current || newIndex === prevIndex.current) return;
    isAnimating.current = true;

    const assignments = getSlotAssignment(newIndex, totalCards);
    const isMobile = window.innerWidth < 768;
    const vwScale = isMobile ? window.innerWidth / 1200 : 1;

    // Animate step counter
    if (stepNumRef.current) {
      gsap.to(stepNumRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.15,
        ease: 'power3.in',
        onComplete: () => {
          if (stepNumRef.current) {
            stepNumRef.current.textContent = '0' + (newIndex + 1);
            gsap.fromTo(stepNumRef.current,
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }
            );
          }
        },
      });
    }

    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const slotName = assignments[i];
      const slot = SLOTS[slotName];
      const finalRotation = slot.rotation + MICRO_OFFSETS[i];
      const finalX = slot.x * vwScale;
      const isGoingToCenter = slotName === 'CENTER';
      const isHiddenOnMobile = isMobile && slotName === 'LEFT_FAR';

      const targetOpacity = isHiddenOnMobile ? 0 : slot.opacity;
      const pointerEvents = isHiddenOnMobile ? 'none' : 'auto';

      // Promote to GPU layer before animating
      card.style.willChange = 'transform, opacity';

      if (isGoingToCenter) {
        // Rising center card: set z-index immediately, lift then land
        gsap.set(card, { zIndex: slot.zIndex, pointerEvents: 'auto' });
        const tl = gsap.timeline({
          onComplete: () => {
            isAnimating.current = false;
            card.style.willChange = 'auto';
          },
        });
        tl.to(card, {
          x: finalX,
          y: -12,
          rotation: finalRotation * 0.3,
          scale: slot.scale,
          opacity: targetOpacity,
          duration: 0.3,
          ease: 'power3.in',
        });
        tl.to(card, {
          y: slot.y * vwScale,
          rotation: finalRotation,
          duration: 0.35,
          ease: 'power3.out',
        });
      } else {
        // Other cards: animate full, set z-index after
        gsap.to(card, {
          x: finalX,
          y: slot.y * vwScale,
          rotation: finalRotation,
          scale: slot.scale,
          opacity: targetOpacity,
          duration: 0.65,
          ease: 'power3.inOut',
          onComplete: () => {
            gsap.set(card, { zIndex: slot.zIndex, pointerEvents });
            card.style.willChange = 'auto';
          },
        });
      }
    });

    prevIndex.current = newIndex;
    setActiveIndex(newIndex);
  }, [totalCards]);

  /* ── Initialize card positions ── */
  useEffect(() => {
    const assignments = getSlotAssignment(0, totalCards);
    const isMobile = window.innerWidth < 768;
    const vwScale = isMobile ? window.innerWidth / 1200 : 1;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const slotName = assignments[i];
      const slot = SLOTS[slotName];
      const isHiddenOnMobile = isMobile && slotName === 'LEFT_FAR';
      gsap.set(card, {
        x: slot.x * vwScale,
        y: slot.y * vwScale,
        rotation: slot.rotation + MICRO_OFFSETS[i],
        scale: slot.scale,
        opacity: isHiddenOnMobile ? 0 : slot.opacity,
        zIndex: slot.zIndex,
        pointerEvents: isHiddenOnMobile ? 'none' : 'auto',
      });
    });

    // Refresh remaining ScrollTriggers after layout settles
    ScrollTrigger.refresh();
  }, [totalCards]);

  /* ── Manual nav ── */
  const goNext = useCallback(() => {
    const next = (prevIndex.current + 1) % totalCards;
    animateToIndex(next);
  }, [totalCards, animateToIndex]);

  const goPrev = useCallback(() => {
    const prev = (prevIndex.current - 1 + totalCards) % totalCards;
    animateToIndex(prev);
  }, [totalCards, animateToIndex]);

  /* ── Drag interaction on active card ── */
  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!dragCard.current || dragIndex.current === null) return;
    dragCurrentX.current = e.clientX;
    const dx = dragCurrentX.current - dragStartX.current;
    const i = dragIndex.current;
    gsap.set(dragCard.current, {
      x: dx * 0.92,
      rotation: MICRO_OFFSETS[i] + dx * 0.022,
      scale: 1.03,
    });
  }, []);

  const endDrag = useCallback(() => {
    const card = dragCard.current;
    const idx = dragIndex.current;
    if (!card || idx === null) return;

    const dx = dragCurrentX.current - dragStartX.current;
    const threshold = 72;

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', endDrag);

    if (Math.abs(dx) > threshold) {
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    } else {
      gsap.to(card, {
        x: 0,
        rotation: MICRO_OFFSETS[idx],
        scale: 1,
        duration: 0.45,
        ease: 'power3.out',
      });
    }

    isDragging.current = false;
    dragCard.current = null;
    dragIndex.current = null;
  }, [goNext, goPrev, onPointerMove]);

  const startDrag = useCallback((e: React.PointerEvent<HTMLDivElement>, index: number) => {
    if (isAnimating.current) return;
    if (index !== activeIndex) {
      animateToIndex(index);
      return;
    }
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragCurrentX.current = e.clientX;
    dragCard.current = e.currentTarget;
    dragIndex.current = index;

    e.currentTarget.setPointerCapture(e.pointerId);
    gsap.killTweensOf(e.currentTarget);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
  }, [activeIndex, animateToIndex, onPointerMove, endDrag]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
    };
  }, [onPointerMove, endDrag]);

  return (
    <div ref={sectionRef} className="craft-act" id="craftsmanship" data-cursor-zone="dark">
      <div className="craft-bg-text" aria-hidden="true">COLLECTOR REVIEWS</div>

      {/* Step counter — top right */}
      <div className="craft-step-counter">
        <span ref={stepNumRef} className="craft-step-num">01</span>
        <span className="craft-step-total">/ 0{totalCards}</span>
      </div>

      {/* Card stage */}
      <div className="craft-stage">
        {stations.map((station, i) => {
          const reviewer = REVIEWERS[i % REVIEWERS.length];

          return (
            <div
              key={station.number}
              ref={(el) => { cardRefs.current[i] = el; }}
              className={`craft-card${i === activeIndex ? ' craft-card--active' : ''}`}
              onPointerDown={(e) => startDrag(e, i)}
            >
              {/* Card body */}
              <div className="craft-card-body">
                <div className="craft-review-head">
                  <div className="craft-review-avatar" aria-hidden="true">{reviewer.initials}</div>
                  <div className="craft-review-meta">
                    <span className="craft-review-name">{reviewer.name}</span>
                    <span className="craft-review-role">{reviewer.role}</span>
                  </div>
                </div>

                <h3 className="craft-card-title">{station.title}</h3>
                <p className="craft-card-desc">"{station.body}"</p>

                <div className="craft-review-foot">
                  <span className="craft-review-step">{station.label}</span>
                  <span className="craft-review-station">Station {station.number}</span>
                </div>
              </div>

              {/* Progress line */}
              <div className="craft-card-progress">
                <div className="craft-card-progress-fill" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation arrows + dots */}
      <div className="craft-nav">
        <button className="craft-nav-arrow" onClick={goPrev} aria-label="Previous card">←</button>
        <div className="craft-nav-dots">
          {stations.map((_, i) => (
            <span
              key={i}
              className={`craft-nav-dot${i === activeIndex ? ' craft-nav-dot--active' : ''}`}
            />
          ))}
        </div>
        <button className="craft-nav-arrow" onClick={goNext} aria-label="Next card">→</button>
      </div>
    </div>
  );
}

export const STATIONS: StationData[] = [
  {
    number: '01',
    label: 'Step One',
    title: 'Source',
    body: 'Each camera arrives from estates, collections, and specialist dealers worldwide. We verify provenance and assess mechanical condition before a single tool touches the body.',
  },
  {
    number: '02',
    label: 'Step Two',
    title: 'Disassemble',
    body: '47 components separated, catalogued, and inspected under 10× magnification. Every spring tension measured, every gear tooth examined for wear.',
  },
  {
    number: '03',
    label: 'Step Three',
    title: 'Restore',
    body: 'Watchmaker-grade lubricants, recalibrated light meters, hand-polished optics. Shutter speeds tested to within ±5% of factory specification.',
  },
  {
    number: '04',
    label: 'Step Four',
    title: 'Archive',
    body: 'Full condition report, provenance documentation, and custom packaging. Each camera leaves with a certificate and its own serial number in our permanent registry.',
  },
];
