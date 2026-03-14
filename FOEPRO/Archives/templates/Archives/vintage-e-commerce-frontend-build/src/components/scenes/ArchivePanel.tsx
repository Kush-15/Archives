import { useRef, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useInViewCanvas } from '@/hooks/useInViewCanvas';
import { usePerformance } from '@/context/PerformanceContext';
import { recordFrame, shouldDowngradeTier } from '@/lib/product3d/tierDetection';

/* ─────────────────────────────────────────────────────────
   Camera registry for the archive section
   ───────────────────────────────────────────────────────── */

interface ArchiveCamera {
  name: string;
  year: number;
  has3D: boolean;
  color?: string;
  metalness?: number;
  roughness?: number;
}

const ARCHIVE_CAMERAS: ArchiveCamera[] = [
  { name: 'Olympus OM-1',         year: 1972, has3D: true,  color: '#1C1C1C', metalness: 0.35, roughness: 0.65 },
  { name: 'Hasselblad 500C',      year: 1957, has3D: true,  color: '#101010', metalness: 0.82, roughness: 0.18 },
  { name: 'Leica M3',             year: 1954, has3D: true,  color: '#1A120A', metalness: 0.55, roughness: 0.38 },
  { name: 'Nikon F',              year: 1959, has3D: false },
  { name: 'Canon AE-1',           year: 1976, has3D: false },
  { name: 'Pentax K1000',         year: 1976, has3D: false },
  { name: 'Minolta SRT 101',      year: 1966, has3D: false },
  { name: 'Rolleiflex 2.8F',      year: 1960, has3D: false },
  { name: 'Contax T2',            year: 1990, has3D: false },
  { name: 'Mamiya RB67',          year: 1970, has3D: false },
  { name: 'Yashica Mat-124G',     year: 1970, has3D: false },
  { name: 'Polaroid SX-70',       year: 1972, has3D: false },
  { name: 'Bronica SQ-A',         year: 1982, has3D: false },
  { name: 'Fujica ST801',         year: 1973, has3D: false },
  { name: 'Voigtländer Bessa R',  year: 1999, has3D: false },
];

/* ─────────────────────────────────────────────────────────
   FPS monitor — wired to runtimeDowngrade
   ───────────────────────────────────────────────────────── */

function FrameMonitor({ onDowngrade }: { onDowngrade: () => void }) {
  const frameCount = useRef(0);
  useFrame((_, delta) => {
    recordFrame(delta * 1000);
    frameCount.current++;
    if (frameCount.current >= 60) {
      frameCount.current = 0;
      if (shouldDowngradeTier()) onDowngrade();
    }
  });
  return null;
}

/* ─────────────────────────────────────────────────────────
   Procedural camera for archive viewer
   ───────────────────────────────────────────────────────── */

function ArchiveCameraModel({
  name,
  color = '#1C1C1C',
  metalness = 0.35,
  roughness = 0.65,
  shadowLight,
  onDowngrade,
}: {
  name: string;
  color?: string;
  metalness?: number;
  roughness?: number;
  /** Whether the directional light casts shadows (medium = false, high = true) */
  shadowLight: boolean;
  onDowngrade: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const controlsActive = useRef(false);

  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color, metalness, roughness }),
    [color, metalness, roughness]
  );
  const silverMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c8c8c8', metalness: 0.95, roughness: 0.12 }),
    []
  );

  useFrame(() => {
    if (!groupRef.current || controlsActive.current) return;
    groupRef.current.rotation.y += 0.009;
  });

  return (
    <>
      <FrameMonitor onDowngrade={onDowngrade} />

      <group ref={groupRef} scale={0.9}>

        {/* ── Olympus OM-1 — compact 35mm SLR ── */}
        {name === 'Olympus OM-1' && <>
          <mesh material={bodyMat} castShadow>
            <boxGeometry args={[2.0, 1.1, 0.92]} />
          </mesh>
          {/* Pentaprism hump */}
          <mesh material={bodyMat} position={[0.1, 0.76, 0.02]}>
            <boxGeometry args={[0.92, 0.36, 0.8]} />
          </mesh>
          {/* Top plate */}
          <mesh material={silverMat} position={[0, 0.61, 0]}>
            <boxGeometry args={[2.05, 0.13, 0.94]} />
          </mesh>
          {/* Bottom plate */}
          <mesh material={silverMat} position={[0, -0.61, 0]}>
            <boxGeometry args={[2.05, 0.13, 0.94]} />
          </mesh>
          {/* Lens — centered */}
          <mesh material={bodyMat} position={[-0.1, -0.05, 0.78]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.31, 0.34, 0.58, 32]} />
          </mesh>
          {/* Film advance lever */}
          <mesh material={silverMat} position={[0.82, 0.68, 0]}>
            <boxGeometry args={[0.14, 0.08, 0.18]} />
          </mesh>
        </>}

        {/* ── Hasselblad 500C — square medium-format SLR ── */}
        {name === 'Hasselblad 500C' && <>
          {/* Main body — nearly square */}
          <mesh material={bodyMat} castShadow>
            <boxGeometry args={[1.65, 1.7, 1.18]} />
          </mesh>
          {/* Film magazine on back */}
          <mesh material={bodyMat} position={[0, 0, -0.9]}>
            <boxGeometry args={[1.6, 1.65, 0.62]} />
          </mesh>
          {/* Waist-level finder top */}
          <mesh material={bodyMat} position={[0, 1.05, 0.12]}>
            <boxGeometry args={[1.55, 0.4, 0.64]} />
          </mesh>
          {/* Front plate (silver) */}
          <mesh material={silverMat} position={[0, 0, 0.65]}>
            <boxGeometry args={[1.67, 1.72, 0.1]} />
          </mesh>
          {/* Wide lens barrel */}
          <mesh material={bodyMat} position={[0, 0.1, 0.92]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.46, 0.5, 0.6, 32]} />
          </mesh>
        </>}

        {/* ── Leica M3 — wide flat rangefinder ── */}
        {name === 'Leica M3' && <>
          {/* Body — wide and low */}
          <mesh material={bodyMat} castShadow>
            <boxGeometry args={[2.4, 0.95, 0.7]} />
          </mesh>
          {/* Top plate (chrome) */}
          <mesh material={silverMat} position={[0, 0.54, 0]}>
            <boxGeometry args={[2.44, 0.13, 0.72]} />
          </mesh>
          {/* Bottom plate (chrome) */}
          <mesh material={silverMat} position={[0, -0.54, 0]}>
            <boxGeometry args={[2.44, 0.13, 0.72]} />
          </mesh>
          {/* Lens — small, offset left */}
          <mesh material={bodyMat} position={[-0.44, 0.04, 0.57]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.23, 0.25, 0.46, 32]} />
          </mesh>
          {/* Rangefinder window */}
          <mesh material={silverMat} position={[0.54, 0.08, 0.37]}>
            <boxGeometry args={[0.21, 0.12, 0.04]} />
          </mesh>
          {/* Viewfinder window */}
          <mesh material={silverMat} position={[0.86, 0.08, 0.37]}>
            <boxGeometry args={[0.14, 0.1, 0.04]} />
          </mesh>
        </>}

      </group>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        onStart={() => { controlsActive.current = true; }}
      />

      {/* Key light — shadow on high tier only */}
      <directionalLight position={[-5, 5, 5]} intensity={2.2} castShadow={shadowLight} />
      {/* Fill light — always */}
      <directionalLight position={[4, 1, 2]} intensity={0.22} />
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Archive Panel — model or text art viewer
   ───────────────────────────────────────────────────────── */

export default function ArchivePanel() {
  const { use3D, dpr, maxShadowLights, runtimeDowngrade } = usePerformance();
  const [activeIndex, setActiveIndex] = useState(0);
  const { inView, containerRef } = useInViewCanvas();
  const activeCamera = ARCHIVE_CAMERAS[activeIndex];

  // On low tier, has3D cameras fall back to text art (same as non-3D cameras)
  const show3D = activeCamera.has3D && use3D;

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
        {show3D ? (
          <Canvas
            dpr={dpr}
            frameloop={inView ? 'demand' : 'never'}
            gl={{ antialias: false }}
            camera={{ position: [0, 0.5, 5], fov: 40 }}
          >
            <Suspense fallback={null}>
              <ArchiveCameraModel
                name={activeCamera.name}
                color={activeCamera.color}
                metalness={activeCamera.metalness}
                roughness={activeCamera.roughness}
                shadowLight={maxShadowLights >= 1}
                onDowngrade={runtimeDowngrade}
              />
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
