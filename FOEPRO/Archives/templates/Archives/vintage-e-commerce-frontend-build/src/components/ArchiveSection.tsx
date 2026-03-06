import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Group } from 'three';
import gsap from 'gsap';

// ── Camera registry
const CAMERAS = [
  { name: 'Olympus OM-1',       year: 1972, hasModel: true  },
  { name: 'Leica M6',           year: 1984, hasModel: false },
  { name: 'Nikon F3',           year: 1980, hasModel: false },
  { name: 'Canon AE-1',         year: 1976, hasModel: false },
  { name: 'Contax RTS',         year: 1975, hasModel: false },
  { name: 'Hasselblad 500CM',   year: 1970, hasModel: false },
  { name: 'Rolleiflex 2.8F',    year: 1960, hasModel: false },
  { name: 'Voigtländer Bessa',  year: 1950, hasModel: false },
  { name: 'Minolta X-700',      year: 1981, hasModel: false },
  { name: 'Pentax K1000',       year: 1976, hasModel: false },
  { name: 'Yashica Electro 35', year: 1966, hasModel: false },
  { name: 'Mamiya RB67',        year: 1970, hasModel: false },
  { name: 'Bronica ETRSi',      year: 1989, hasModel: false },
  { name: 'Fuji GW690',         year: 1979, hasModel: false },
  { name: 'Linhof Technika',    year: 1946, hasModel: false },
];

// ── Procedural 3D camera (used for Olympus OM-1)
function CameraSculpture() {
  const groupRef = useRef<Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.28;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[1.8, 1, 0.8]} />
        <meshStandardMaterial color="#222226" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0.7, 0, 0.55]}>
        <cylinderGeometry args={[0.34, 0.34, 0.56, 64]} />
        <meshStandardMaterial color="#16161a" metalness={0.65} roughness={0.25} />
      </mesh>
      <mesh position={[-0.25, 0.34, 0.45]}>
        <boxGeometry args={[0.5, 0.2, 0.2]} />
        <meshStandardMaterial color="#2a2a2e" metalness={0.2} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ── Placeholder panel for cameras without a model
function CameraPlaceholder({ camera }: { camera: typeof CAMERAS[0] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.from(ref.current, {
      opacity: 0, y: 16, duration: 0.55, ease: 'power3.out'
    });
  }, [camera.name]);

  return (
    <div ref={ref} className="archive-placeholder">
      <span className="t-eyebrow archive-placeholder-year">{camera.year}</span>
      <h3 className="archive-placeholder-name">{camera.name}</h3>
      <p className="archive-placeholder-msg t-eyebrow">
        Entering the archive
      </p>
      <div className="archive-placeholder-line" />
    </div>
  );
}

// ── Main section
export default function ArchiveSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const active = CAMERAS[activeIndex];

  const handleSelect = (i: number) => {
    if (i === activeIndex) return;
    gsap.to(panelRef.current, {
      opacity: 0, scale: 0.97, duration: 0.22, ease: 'power2.in',
      onComplete: () => {
        setActiveIndex(i);
        gsap.to(panelRef.current, {
          opacity: 1, scale: 1, duration: 0.38, ease: 'power3.out'
        });
      },
    });
  };

  return (
    <section id="global" className="archive-section">

      {/* Left col — stats */}
      <div className="archive-left">
        <p className="t-eyebrow">The Archive</p>
        <h2 className="t-section-title">
          Every<br />instrument
        </h2>
        <div className="archive-stats">
          <div className="archive-stat">
            <span className="t-stat-number">2,400</span>
            <span className="t-stat-label">Cameras Restored</span>
          </div>
          <div className="archive-stat">
            <span className="t-stat-number">40</span>
            <span className="t-stat-label">Countries Sourced</span>
          </div>
        </div>
      </div>

      {/* Center col — clickable camera list */}
      <div className="archive-list">
        {CAMERAS.map((cam, i) => (
          <button
            key={cam.name}
            className={`archive-list-item ${
              activeIndex === i ? 'archive-list-item--active' : ''
            }`}
            onClick={() => handleSelect(i)}
            aria-pressed={activeIndex === i}
          >
            <span className="archive-item-name">{cam.name}</span>
            <span className="archive-item-year t-eyebrow">{cam.year}</span>
          </button>
        ))}
      </div>

      {/* Right col — model viewer or placeholder */}
      <div className="archive-panel" ref={panelRef}>
        {active.hasModel ? (
          <>
            <Canvas
              camera={{ fov: 45, position: [0, 0, 3.5] }}
              dpr={Math.min(window.devicePixelRatio, 1.5)}
              gl={{
                antialias: false,
                powerPreference: 'high-performance',
                alpha: true,
              }}
              frameloop="demand"
              className="archive-canvas"
            >
              <ambientLight intensity={0.7} />
              <directionalLight position={[4, 6, 4]} intensity={1.3} />
              <Suspense fallback={null}>
                <CameraSculpture />
              </Suspense>
              <OrbitControls
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.9}
                minPolarAngle={0.3}
                maxPolarAngle={Math.PI / 2}
              />
            </Canvas>
            <p className="archive-panel-hint t-eyebrow">— Drag to rotate —</p>
          </>
        ) : (
          <CameraPlaceholder camera={active} key={active.name} />
        )}
      </div>

    </section>
  );
}
