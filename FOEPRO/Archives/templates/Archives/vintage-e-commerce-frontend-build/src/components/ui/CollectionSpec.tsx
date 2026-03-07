import gsap from 'gsap';
import { useEffect, useRef } from 'react';

interface CameraSpec {
  name: string;
  year: number;
  specs: { label: string; value: string }[];
}

interface CollectionSpecProps {
  camera: CameraSpec | null;
  isOpen: boolean;
  xrayActive: boolean;
  onToggleXray: () => void;
}

export default function CollectionSpec({
  camera,
  isOpen,
  xrayActive,
  onToggleXray,
}: CollectionSpecProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelRef.current) return;

    if (isOpen) {
      gsap.to(panelRef.current, {
        x: 0,
        duration: 0.55,
        ease: 'back.out(1.7)',
      });
    } else {
      gsap.to(panelRef.current, {
        x: '110%',
        duration: 0.35,
        ease: 'power3.in',
      });
    }
  }, [isOpen]);

  if (!camera) return null;

  return (
    <div
      ref={panelRef}
      className="collection-spec-panel"
      style={{ transform: 'translateX(110%)' }}
    >
      <div>
        <div className="typo-label" style={{ opacity: 0.5, marginBottom: '0.5rem' }}>
          {camera.year}
        </div>
        <div className="spec-panel-name">{camera.name}</div>
      </div>

      <div className="spec-panel-table">
        {camera.specs.slice(0, 4).map((s, i) => (
          <div key={i} className="spec-panel-row">
            <span className="spec-panel-label">{s.label}</span>
            <span className="spec-panel-val">{s.value}</span>
          </div>
        ))}
      </div>

      <button
        className={`xray-toggle ${xrayActive ? 'xray-toggle--active' : ''}`}
        onClick={onToggleXray}
        aria-label={xrayActive ? 'Disable X-ray view' : 'Enable X-ray view'}
      >
        [X-RAY]
      </button>

      <a href="/catalog" className="spec-panel-cta">
        View in collection <span>→</span>
      </a>
    </div>
  );
}
