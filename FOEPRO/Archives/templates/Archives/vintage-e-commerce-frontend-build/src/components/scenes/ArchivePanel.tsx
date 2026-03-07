import { useRef, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useInViewCanvas } from '@/hooks/useInViewCanvas';

/* ─────────────────────────────────────────────────────────
   Camera registry for the archive section
   ───────────────────────────────────────────────────────── */

interface ArchiveCamera {
  name: string;
  year: number;
  has3D: boolean;
  color?: string;
}

const ARCHIVE_CAMERAS: ArchiveCamera[] = [
  { name: 'Olympus OM-1', year: 1972, has3D: true, color: '#1a1a1a' },
  { name: 'Hasselblad 500C', year: 1957, has3D: true, color: '#222222' },
  { name: 'Leica M3', year: 1954, has3D: true, color: '#181818' },
  { name: 'Nikon F', year: 1959, has3D: false },
  { name: 'Canon AE-1', year: 1976, has3D: false },
  { name: 'Pentax K1000', year: 1976, has3D: false },
  { name: 'Minolta SRT 101', year: 1966, has3D: false },
  { name: 'Rolleiflex 2.8F', year: 1960, has3D: false },
  { name: 'Contax T2', year: 1990, has3D: false },
  { name: 'Mamiya RB67', year: 1970, has3D: false },
  { name: 'Yashica Mat-124G', year: 1970, has3D: false },
  { name: 'Polaroid SX-70', year: 1972, has3D: false },
  { name: 'Bronica SQ-A', year: 1982, has3D: false },
  { name: 'Fujica ST801', year: 1973, has3D: false },
  { name: 'Voigtländer Bessa R', year: 1999, has3D: false },
];

/* ─────────────────────────────────────────────────────────
   Procedural camera for archive viewer
   ───────────────────────────────────────────────────────── */

function ArchiveCameraModel({ color = '#1a1a1a' }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const controlsActive = useRef(false);

  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.25 }),
    [color]
  );
  const silverMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c0c0c0', metalness: 0.95, roughness: 0.15 }),
    []
  );

  useFrame(() => {
    if (!groupRef.current || controlsActive.current) return;
    groupRef.current.rotation.y += 0.009; // 0.9°/frame ≈ 0.9°/s at 60fps
  });

  return (
    <>
      <group ref={groupRef} scale={0.9}>
        <mesh material={bodyMat} castShadow>
          <boxGeometry args={[2.4, 1.5, 1.2]} />
        </mesh>
        <mesh material={silverMat} position={[0, 0.82, 0]}>
          <boxGeometry args={[2.5, 0.15, 1.22]} />
        </mesh>
        <mesh material={silverMat} position={[0, -0.82, 0]}>
          <boxGeometry args={[2.5, 0.15, 1.22]} />
        </mesh>
        <mesh material={bodyMat} position={[0, 1.05, 0]}>
          <boxGeometry args={[1.0, 0.3, 0.8]} />
        </mesh>
        <mesh
          material={bodyMat}
          position={[0, -0.05, 0.9]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.5, 0.55, 0.7, 32]} />
        </mesh>
      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        onStart={() => {
          controlsActive.current = true;
        }}
      />

      <directionalLight position={[-5, 5, 5]} intensity={2.2} castShadow />
      <directionalLight position={[4, 1, 2]} intensity={0.22} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Archive Panel — model or text art viewer
   ───────────────────────────────────────────────────────── */

export default function ArchivePanel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { inView, containerRef } = useInViewCanvas();
  const activeCamera = ARCHIVE_CAMERAS[activeIndex];

  return (
    <section className="archive-act" id="archive" data-cursor-zone="dark">
      {/* Left — Stats */}
      <div className="archive-stats-col">
        <div className="typo-label" style={{ opacity: 0.4, marginBottom: '2rem' }}>
          The Archive
        </div>

        <div className="archive-stat-block">
          <div className="archive-stat-number">2,400</div>
          <div className="archive-stat-label">Cameras restored</div>
        </div>
        <div className="archive-stat-block">
          <div className="archive-stat-number">40</div>
          <div className="archive-stat-label">Countries sourced</div>
        </div>
        <div className="archive-stat-block">
          <div className="archive-stat-number">1972</div>
          <div className="archive-stat-label">Year established</div>
        </div>
      </div>

      {/* Center — Camera index */}
      <div className="archive-index">
        {ARCHIVE_CAMERAS.map((cam, i) => (
          <button
            key={cam.name}
            className={`archive-index-item ${i === activeIndex ? 'archive-index-item--active' : ''}`}
            onClick={() => setActiveIndex(i)}
            aria-label={`View ${cam.name}`}
          >
            <span className="archive-index-name">{cam.name}</span>
            <span className="archive-index-year">{cam.year}</span>
          </button>
        ))}
      </div>

      {/* Right — Viewer */}
      <div className="archive-viewer" ref={containerRef}>
        {activeCamera.has3D ? (
          <Canvas
            dpr={[1, 1.5]}
            frameloop={inView ? 'demand' : 'never'}
            gl={{ antialias: false }}
            camera={{ position: [0, 0.5, 5], fov: 40 }}
          >
            <Suspense fallback={null}>
              <ArchiveCameraModel color={activeCamera.color || '#1a1a1a'} />
            </Suspense>
          </Canvas>
        ) : (
          <div className="archive-text-art">
            <div className="archive-text-art-name">{activeCamera.name}</div>
          </div>
        )}
      </div>
    </section>
  );
}
