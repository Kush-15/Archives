import { useRef, useState, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { MeshPhysicalMaterial } from 'three';
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
  // PBR material profiles
  bodyColor: string;
  bodyMetalness: number;
  bodyRoughness: number;
  chromeColor: string;
  chromeMetalness: number;
  chromeRoughness: number;
  lensBarrelColor: string;
  lensBarrelMetalness: number;
  lensBarrelRoughness: number;
}

const ARCHIVE_CAMERAS: ArchiveCamera[] = [
  {
    name: 'Olympus OM-1', year: 1972, has3D: true,
    bodyColor: '#1A1A18', bodyMetalness: 0.0, bodyRoughness: 0.85,
    chromeColor: '#C8C8C8', chromeMetalness: 0.95, chromeRoughness: 0.25,
    lensBarrelColor: '#111111', lensBarrelMetalness: 0.8, lensBarrelRoughness: 0.15,
  },
  {
    name: 'Hasselblad 500C', year: 1957, has3D: true,
    bodyColor: '#1E1E1E', bodyMetalness: 0.2, bodyRoughness: 0.75,
    chromeColor: '#D0D0D0', chromeMetalness: 0.96, chromeRoughness: 0.18,
    lensBarrelColor: '#0A0A0A', lensBarrelMetalness: 0.85, lensBarrelRoughness: 0.12,
  },
  {
    name: 'Leica M3', year: 1954, has3D: true,
    bodyColor: '#1C1814', bodyMetalness: 0.0, bodyRoughness: 0.8,
    chromeColor: '#D4D4D8', chromeMetalness: 0.98, chromeRoughness: 0.12,
    lensBarrelColor: '#0A0A0A', lensBarrelMetalness: 0.85, lensBarrelRoughness: 0.1,
  },
  {
    name: 'Nikon F', year: 1959, has3D: false,
    bodyColor: '#1F1F1F', bodyMetalness: 0.15, bodyRoughness: 0.7,
    chromeColor: '#B8B8B8', chromeMetalness: 0.92, chromeRoughness: 0.2,
    lensBarrelColor: '#1A1A1A', lensBarrelMetalness: 0.8, lensBarrelRoughness: 0.12,
  },
  {
    name: 'Canon AE-1', year: 1976, has3D: false,
    bodyColor: '#0F0F0F', bodyMetalness: 0.0, bodyRoughness: 0.9,
    chromeColor: '#A8A8A8', chromeMetalness: 0.7, chromeRoughness: 0.35,
    lensBarrelColor: '#0D0D0D', lensBarrelMetalness: 0.6, lensBarrelRoughness: 0.2,
  },
  {
    name: 'Pentax K1000', year: 1976, has3D: false,
    bodyColor: '#1A1A1A', bodyMetalness: 0.05, bodyRoughness: 0.8,
    chromeColor: '#C4C4C4', chromeMetalness: 0.94, chromeRoughness: 0.22,
    lensBarrelColor: '#0E0E0E', lensBarrelMetalness: 0.78, lensBarrelRoughness: 0.18,
  },
  {
    name: 'Minolta SRT 101', year: 1966, has3D: false,
    bodyColor: '#141414', bodyMetalness: 0.0, bodyRoughness: 0.88,
    chromeColor: '#B0B0B0', chromeMetalness: 0.85, chromeRoughness: 0.3,
    lensBarrelColor: '#0C0C0C', lensBarrelMetalness: 0.7, lensBarrelRoughness: 0.2,
  },
  {
    name: 'Rolleiflex 2.8F', year: 1960, has3D: false,
    bodyColor: '#1F1814', bodyMetalness: 0.0, bodyRoughness: 0.88,
    chromeColor: '#BCBCBC', chromeMetalness: 0.85, chromeRoughness: 0.4,
    lensBarrelColor: '#161610', lensBarrelMetalness: 0.7, lensBarrelRoughness: 0.25,
  },
  {
    name: 'Contax T2', year: 1990, has3D: false,
    bodyColor: '#2A2A2A', bodyMetalness: 0.3, bodyRoughness: 0.65,
    chromeColor: '#D8D8D8', chromeMetalness: 0.96, chromeRoughness: 0.18,
    lensBarrelColor: '#1C1C1C', lensBarrelMetalness: 0.85, lensBarrelRoughness: 0.15,
  },
  {
    name: 'Mamiya RB67', year: 1970, has3D: false,
    bodyColor: '#232320', bodyMetalness: 0.0, bodyRoughness: 0.84,
    chromeColor: '#BFBFBF', chromeMetalness: 0.91, chromeRoughness: 0.25,
    lensBarrelColor: '#0F0F0D', lensBarrelMetalness: 0.8, lensBarrelRoughness: 0.16,
  },
  {
    name: 'Yashica Mat-124G', year: 1970, has3D: false,
    bodyColor: '#1F1916', bodyMetalness: 0.0, bodyRoughness: 0.87,
    chromeColor: '#B4B4B4', chromeMetalness: 0.82, chromeRoughness: 0.42,
    lensBarrelColor: '#121210', lensBarrelMetalness: 0.68, lensBarrelRoughness: 0.28,
  },
  {
    name: 'Polaroid SX-70', year: 1972, has3D: false,
    bodyColor: '#8B7355', bodyMetalness: 0.0, bodyRoughness: 0.85,
    chromeColor: '#C0C0C0', chromeMetalness: 0.9, chromeRoughness: 0.2,
    lensBarrelColor: '#101010', lensBarrelMetalness: 0.6, lensBarrelRoughness: 0.3,
  },
  {
    name: 'Bronica SQ-A', year: 1982, has3D: false,
    bodyColor: '#121212', bodyMetalness: 0.0, bodyRoughness: 0.95,
    chromeColor: '#C2C2C2', chromeMetalness: 0.88, chromeRoughness: 0.32,
    lensBarrelColor: '#0A0A0A', lensBarrelMetalness: 0.76, lensBarrelRoughness: 0.19,
  },
  {
    name: 'Fujica ST801', year: 1973, has3D: false,
    bodyColor: '#1A1612', bodyMetalness: 0.0, bodyRoughness: 0.88,
    chromeColor: '#A8A070', chromeMetalness: 0.65, chromeRoughness: 0.45,
    lensBarrelColor: '#0F0D0A', lensBarrelMetalness: 0.55, lensBarrelRoughness: 0.35,
  },
  {
    name: 'Voigtländer Bessa R', year: 1999, has3D: false,
    bodyColor: '#2A2420', bodyMetalness: 0.05, bodyRoughness: 0.85,
    chromeColor: '#B0B0B0', chromeMetalness: 0.8, chromeRoughness: 0.45,
    lensBarrelColor: '#151510', lensBarrelMetalness: 0.65, lensBarrelRoughness: 0.3,
  },
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
   Procedural camera for archive viewer — photorealistic
   ───────────────────────────────────────────────────────── */

function ArchiveCameraModel({
  camera,
  shadowLight,
  onDowngrade,
}: {
  camera: ArchiveCamera;
  shadowLight: boolean;
  onDowngrade: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const controlsActive = useRef(false);

  /* ── Authentic PBR materials ── */

  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: camera.bodyColor,
      metalness: camera.bodyMetalness,
      roughness: camera.bodyRoughness,
      envMapIntensity: 0.6,
    }),
    [camera.bodyColor, camera.bodyMetalness, camera.bodyRoughness]
  );

  const chromeMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: camera.chromeColor,
      metalness: camera.chromeMetalness,
      roughness: camera.chromeRoughness,
      envMapIntensity: 0.8,
    }),
    [camera.chromeColor, camera.chromeMetalness, camera.chromeRoughness]
  );

  const lensBarrelMat = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: camera.lensBarrelColor,
      metalness: camera.lensBarrelMetalness,
      roughness: camera.lensBarrelRoughness,
      envMapIntensity: 0.7,
    }),
    [camera.lensBarrelColor, camera.lensBarrelMetalness, camera.lensBarrelRoughness]
  );

  const lensMat = useMemo(
    () => new MeshPhysicalMaterial({
      color: '#FFFFFF',
      metalness: 0.0,
      roughness: 0.0,
      transmission: 0.95,
      ior: 1.52,
      thickness: 0.5,
    }),
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
        {camera.name === 'Olympus OM-1' && <>
          <mesh material={bodyMat} castShadow receiveShadow>
            <boxGeometry args={[2.0, 1.1, 0.92]} />
          </mesh>
          <mesh material={bodyMat} position={[0.1, 0.76, 0.02]} castShadow>
            <boxGeometry args={[0.92, 0.36, 0.8]} />
          </mesh>
          <mesh material={chromeMat} position={[0, 0.61, 0]} castShadow>
            <boxGeometry args={[2.05, 0.13, 0.94]} />
          </mesh>
          <mesh material={chromeMat} position={[0, -0.61, 0]} castShadow>
            <boxGeometry args={[2.05, 0.13, 0.94]} />
          </mesh>
          <mesh material={lensBarrelMat} position={[-0.1, -0.05, 0.78]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.31, 0.34, 0.58, 32]} />
          </mesh>
          <mesh material={lensMat} position={[-0.1, -0.05, 1.12]}>
            <sphereGeometry args={[0.23, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh material={chromeMat} position={[-0.1, -0.05, 0.68]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.35, 0.022, 8, 24]} />
          </mesh>
          <mesh material={chromeMat} position={[0.82, 0.68, 0]} castShadow>
            <boxGeometry args={[0.14, 0.08, 0.18]} />
          </mesh>
        </>}

        {/* ── Hasselblad 500C — square medium-format SLR ── */}
        {camera.name === 'Hasselblad 500C' && <>
          <mesh material={bodyMat} castShadow receiveShadow>
            <boxGeometry args={[1.65, 1.7, 1.18]} />
          </mesh>
          <mesh material={bodyMat} position={[0, 0, -0.9]} castShadow>
            <boxGeometry args={[1.6, 1.65, 0.62]} />
          </mesh>
          <mesh material={bodyMat} position={[0, 1.05, 0.12]} castShadow>
            <boxGeometry args={[1.55, 0.4, 0.64]} />
          </mesh>
          <mesh material={chromeMat} position={[0, 0, 0.65]} castShadow>
            <boxGeometry args={[1.67, 1.72, 0.1]} />
          </mesh>
          <mesh material={lensBarrelMat} position={[0, 0.1, 0.92]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.46, 0.5, 0.6, 32]} />
          </mesh>
          <mesh material={lensMat} position={[0, 0.1, 1.26]}>
            <sphereGeometry args={[0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh material={chromeMat} position={[0, 0.1, 0.84]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.49, 0.025, 8, 24]} />
          </mesh>
        </>}

        {/* ── Leica M3 — wide flat rangefinder ── */}
        {camera.name === 'Leica M3' && <>
          <mesh material={bodyMat} castShadow receiveShadow>
            <boxGeometry args={[2.4, 0.95, 0.7]} />
          </mesh>
          <mesh material={chromeMat} position={[0, 0.54, 0]} castShadow>
            <boxGeometry args={[2.44, 0.13, 0.72]} />
          </mesh>
          <mesh material={chromeMat} position={[0, -0.54, 0]} castShadow>
            <boxGeometry args={[2.44, 0.13, 0.72]} />
          </mesh>
          <mesh material={lensBarrelMat} position={[-0.44, 0.04, 0.57]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.23, 0.25, 0.46, 32]} />
          </mesh>
          <mesh material={lensMat} position={[-0.44, 0.04, 0.84]}>
            <sphereGeometry args={[0.18, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh material={chromeMat} position={[-0.44, 0.04, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.26, 0.018, 8, 24]} />
          </mesh>
          <mesh material={chromeMat} position={[0.54, 0.08, 0.37]} castShadow>
            <boxGeometry args={[0.21, 0.12, 0.04]} />
          </mesh>
          <mesh material={chromeMat} position={[0.86, 0.08, 0.37]} castShadow>
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

      {/* ── Three-point studio lighting ── */}
      <directionalLight
        position={[-4, 6, 4]}
        intensity={1.4}
        color="#FFF8F0"
        castShadow={shadowLight}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[5, 2, 3]} intensity={0.4} color="#E0E8FF" />
      <directionalLight position={[0, 3, -5]} intensity={0.5} color="#CCDDFF" />
      <ambientLight intensity={0.15} color="#FFFFFF" />

      {/* ── Environment + Grounding + Post-processing ── */}
      <Environment preset="studio" background={false} />
      <ContactShadows
        position={[0, -0.9, 0]}
        opacity={0.5}
        scale={4}
        blur={2.5}
        far={1.0}
      />
      <EffectComposer>
        <Bloom luminanceThreshold={0.85} intensity={0.15} radius={0.6} />
      </EffectComposer>
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
            gl={{ antialias: false, powerPreference: 'high-performance' }}
            camera={{ position: [0, 0.5, 5], fov: 40 }}
          >
            <Suspense fallback={null}>
              <ArchiveCameraModel
                camera={activeCamera}
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
