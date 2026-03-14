import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Group } from 'three';
import gsap from 'gsap';
import { useInViewCanvas } from '@/hooks/useInViewCanvas';
import { usePerformance } from '@/context/PerformanceContext';
import { recordFrame, shouldDowngradeTier } from '@/lib/product3d/tierDetection';

/* ── Types ──────────────────────────────────────────────── */

interface CameraStyle {
  ambientIntensity: number;
  ambientColor: string;
  keyIntensity: number;
  keyColor: string;
  keyPosition: [number, number, number];
  rimIntensity: number;
  rimColor: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  fogColor: string;
  fogNear: number;
  fogFar: number;
  autoRotateSpeed: number;
  autoRotateAxis: 'y' | 'x';
  roughness: number | null;
  metalness: number | null;
  color: string | null;
  emissive: string | null;
  emissiveIntensity: number;
  placeholderAccent: string;
  placeholderTextColor: string;
  descriptor: string;
}

interface ArchiveCameraEntry {
  name: string;
  year: number;
  hasModel: boolean;
  style: CameraStyle;
}

/* ── Camera registry ────────────────────────────────────── */

const CAMERAS: ArchiveCameraEntry[] = [
  {
    name: 'Olympus OM-1', year: 1972, hasModel: true,
    style: {
      ambientIntensity: 0.3, ambientColor: '#FFFFFF',
      keyIntensity: 2.2, keyColor: '#FFF5E6',
      keyPosition: [-4, 6, 3],
      rimIntensity: 0.8, rimColor: '#C8C8FF',
      cameraPosition: [0, 0.3, 3.2], cameraTarget: [0, 0, 0],
      fogColor: '#0A0A0A', fogNear: 6, fogFar: 14,
      autoRotateSpeed: 0.6, autoRotateAxis: 'y',
      roughness: 0.7, metalness: 0.4, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#5C6EFF', placeholderTextColor: '#F8F7F4',
      descriptor: 'Matte black body. Mechanical precision.',
    },
  },
  {
    name: 'Leica M6', year: 1984, hasModel: false,
    style: {
      ambientIntensity: 0.2, ambientColor: '#FFF8F0',
      keyIntensity: 2.8, keyColor: '#FFFAF5',
      keyPosition: [3, 8, 2],
      rimIntensity: 0.4, rimColor: '#FFE8C8',
      cameraPosition: [0.5, 0.2, 3.0], cameraTarget: [0, 0, 0],
      fogColor: '#080808', fogNear: 5, fogFar: 12,
      autoRotateSpeed: 0.4, autoRotateAxis: 'y',
      roughness: 0.3, metalness: 0.8, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#C9A96E', placeholderTextColor: '#F8F7F4',
      descriptor: 'German precision. 0.72× viewfinder.',
    },
  },
  {
    name: 'Nikon F3', year: 1980, hasModel: false,
    style: {
      ambientIntensity: 0.4, ambientColor: '#E8F0FF',
      keyIntensity: 2.0, keyColor: '#F0F5FF',
      keyPosition: [-6, 4, 4],
      rimIntensity: 1.2, rimColor: '#8899FF',
      cameraPosition: [-0.3, 0, 3.4], cameraTarget: [0, 0, 0],
      fogColor: '#060810', fogNear: 6, fogFar: 16,
      autoRotateSpeed: 0.5, autoRotateAxis: 'y',
      roughness: 0.5, metalness: 0.6, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#8899FF', placeholderTextColor: '#E8F0FF',
      descriptor: 'Giugiaro design. Titanium shutter.',
    },
  },
  {
    name: 'Canon AE-1', year: 1976, hasModel: false,
    style: {
      ambientIntensity: 0.5, ambientColor: '#FFE8CC',
      keyIntensity: 1.8, keyColor: '#FFD080',
      keyPosition: [4, 5, 2],
      rimIntensity: 0.6, rimColor: '#FF8844',
      cameraPosition: [0.2, -0.1, 3.6], cameraTarget: [0, 0, 0],
      fogColor: '#120800', fogNear: 7, fogFar: 18,
      autoRotateSpeed: 0.8, autoRotateAxis: 'y',
      roughness: 0.8, metalness: 0.2, color: null,
      emissive: '#200800', emissiveIntensity: 0.05,
      placeholderAccent: '#FFD080', placeholderTextColor: '#FFE8CC',
      descriptor: 'Program AE. 1 million sold.',
    },
  },
  {
    name: 'Contax RTS', year: 1975, hasModel: false,
    style: {
      ambientIntensity: 0.6, ambientColor: '#F0F0F0',
      keyIntensity: 1.6, keyColor: '#FFFFFF',
      keyPosition: [0, 8, 2],
      rimIntensity: 0.3, rimColor: '#CCCCCC',
      cameraPosition: [0, 0.4, 3.0], cameraTarget: [0, 0, 0],
      fogColor: '#111111', fogNear: 5, fogFar: 12,
      autoRotateSpeed: 0.35, autoRotateAxis: 'y',
      roughness: 0.4, metalness: 0.7, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#CCCCCC', placeholderTextColor: '#F0F0F0',
      descriptor: 'Zeiss optics. Stuttgart, 1975.',
    },
  },
  {
    name: 'Hasselblad 500CM', year: 1970, hasModel: false,
    style: {
      ambientIntensity: 0.15, ambientColor: '#FFFFFF',
      keyIntensity: 2.4, keyColor: '#FFFFFF',
      keyPosition: [0, -3, 2],
      rimIntensity: 1.0, rimColor: '#AACCFF',
      cameraPosition: [0, 0.6, 2.8], cameraTarget: [0, 0.1, 0],
      fogColor: '#040408', fogNear: 4, fogFar: 10,
      autoRotateSpeed: 0.25, autoRotateAxis: 'y',
      roughness: 0.6, metalness: 0.5, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#AACCFF', placeholderTextColor: '#FFFFFF',
      descriptor: 'Medium format. Flew to the moon.',
    },
  },
  {
    name: 'Rolleiflex 2.8F', year: 1960, hasModel: false,
    style: {
      ambientIntensity: 0.35, ambientColor: '#FFE0A0',
      keyIntensity: 1.9, keyColor: '#FFCC66',
      keyPosition: [3, 4, 5],
      rimIntensity: 0.5, rimColor: '#FF9944',
      cameraPosition: [0.4, 0.3, 3.2], cameraTarget: [0, 0, 0],
      fogColor: '#110800', fogNear: 6, fogFar: 14,
      autoRotateSpeed: 0.4, autoRotateAxis: 'y',
      roughness: 0.75, metalness: 0.25, color: null,
      emissive: '#180800', emissiveIntensity: 0.04,
      placeholderAccent: '#FFCC66', placeholderTextColor: '#FFE0A0',
      descriptor: 'Twin lens reflex. Planar 80mm.',
    },
  },
  {
    name: 'Voigtländer Bessa', year: 1950, hasModel: false,
    style: {
      ambientIntensity: 0.45, ambientColor: '#FFF5E0',
      keyIntensity: 1.7, keyColor: '#FFE8B0',
      keyPosition: [2, 5, 3],
      rimIntensity: 0.4, rimColor: '#CC9944',
      cameraPosition: [0, 0.2, 3.4], cameraTarget: [0, 0, 0],
      fogColor: '#0E0A04', fogNear: 6, fogFar: 14,
      autoRotateSpeed: 0.45, autoRotateAxis: 'y',
      roughness: 0.6, metalness: 0.5, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#FF6B6B', placeholderTextColor: '#FFF5E0',
      descriptor: 'Folding rangefinder. Postwar Germany.',
    },
  },
  {
    name: 'Minolta X-700', year: 1981, hasModel: false,
    style: {
      ambientIntensity: 0.4, ambientColor: '#F0F4FF',
      keyIntensity: 1.9, keyColor: '#E8F0FF',
      keyPosition: [-3, 6, 3],
      rimIntensity: 0.5, rimColor: '#4444AA',
      cameraPosition: [0, 0, 3.5], cameraTarget: [0, 0, 0],
      fogColor: '#080810', fogNear: 6, fogFar: 14,
      autoRotateSpeed: 0.55, autoRotateAxis: 'y',
      roughness: 0.55, metalness: 0.55, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#4ECDC4', placeholderTextColor: '#F0F4FF',
      descriptor: 'Program mode. Last of the greats.',
    },
  },
  {
    name: 'Pentax K1000', year: 1976, hasModel: false,
    style: {
      ambientIntensity: 0.5, ambientColor: '#F8F8F8',
      keyIntensity: 1.6, keyColor: '#FFFFFF',
      keyPosition: [3, 5, 3],
      rimIntensity: 0.3, rimColor: '#AAAAAA',
      cameraPosition: [0, 0, 3.6], cameraTarget: [0, 0, 0],
      fogColor: '#0C0C0C', fogNear: 6, fogFar: 14,
      autoRotateSpeed: 0.6, autoRotateAxis: 'y',
      roughness: 0.7, metalness: 0.3, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#FFE66D', placeholderTextColor: '#F8F8F8',
      descriptor: 'All-mechanical. Student camera.',
    },
  },
  {
    name: 'Yashica Electro 35', year: 1966, hasModel: false,
    style: {
      ambientIntensity: 0.4, ambientColor: '#FFF0E8',
      keyIntensity: 1.8, keyColor: '#FFE0CC',
      keyPosition: [4, 4, 4],
      rimIntensity: 0.4, rimColor: '#CC6644',
      cameraPosition: [0.1, 0, 3.5], cameraTarget: [0, 0, 0],
      fogColor: '#100806', fogNear: 6, fogFar: 14,
      autoRotateSpeed: 0.5, autoRotateAxis: 'y',
      roughness: 0.65, metalness: 0.4, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#A8E6CF', placeholderTextColor: '#FFF0E8',
      descriptor: 'Aperture priority. 1966.',
    },
  },
  {
    name: 'Mamiya RB67', year: 1970, hasModel: false,
    style: {
      ambientIntensity: 0.3, ambientColor: '#F0F0E8',
      keyIntensity: 2.0, keyColor: '#FFFFFF',
      keyPosition: [-2, 7, 2],
      rimIntensity: 0.4, rimColor: '#888888',
      cameraPosition: [0.2, 0.4, 3.0], cameraTarget: [0, 0, 0],
      fogColor: '#0A0A08', fogNear: 5, fogFar: 12,
      autoRotateSpeed: 0.3, autoRotateAxis: 'y',
      roughness: 0.6, metalness: 0.5, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#FF8B94', placeholderTextColor: '#F0F0E8',
      descriptor: 'Studio medium format. Rotating back.',
    },
  },
  {
    name: 'Bronica ETRSi', year: 1989, hasModel: false,
    style: {
      ambientIntensity: 0.4, ambientColor: '#EEF4FF',
      keyIntensity: 1.8, keyColor: '#F0F8FF',
      keyPosition: [-4, 5, 3],
      rimIntensity: 0.5, rimColor: '#6688CC',
      cameraPosition: [0, 0.3, 3.3], cameraTarget: [0, 0, 0],
      fogColor: '#080C14', fogNear: 6, fogFar: 14,
      autoRotateSpeed: 0.45, autoRotateAxis: 'y',
      roughness: 0.5, metalness: 0.6, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#98DDCA', placeholderTextColor: '#EEF4FF',
      descriptor: '6×4.5 medium format. System camera.',
    },
  },
  {
    name: 'Fuji GW690', year: 1979, hasModel: false,
    style: {
      ambientIntensity: 0.4, ambientColor: '#FFF0F0',
      keyIntensity: 1.9, keyColor: '#FFE8D8',
      keyPosition: [3, 5, 4],
      rimIntensity: 0.4, rimColor: '#CC4444',
      cameraPosition: [0, 0, 3.2], cameraTarget: [0, 0, 0],
      fogColor: '#100808', fogNear: 6, fogFar: 14,
      autoRotateSpeed: 0.5, autoRotateAxis: 'y',
      roughness: 0.7, metalness: 0.35, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#D4A5A5', placeholderTextColor: '#FFF0F0',
      descriptor: 'Texas Leica. Massive 6×9 negative.',
    },
  },
  {
    name: 'Linhof Technika', year: 1946, hasModel: false,
    style: {
      ambientIntensity: 0.3, ambientColor: '#F8F4EC',
      keyIntensity: 2.2, keyColor: '#FFF8F0',
      keyPosition: [1, 8, 3],
      rimIntensity: 0.3, rimColor: '#AA8855',
      cameraPosition: [0, 0.5, 3.0], cameraTarget: [0, 0, 0],
      fogColor: '#0C0A06', fogNear: 5, fogFar: 12,
      autoRotateSpeed: 0.2, autoRotateAxis: 'y',
      roughness: 0.5, metalness: 0.6, color: null,
      emissive: null, emissiveIntensity: 0,
      placeholderAccent: '#9B59B6', placeholderTextColor: '#F8F4EC',
      descriptor: 'Large format. Precision since 1946.',
    },
  },
];

/* ── Scene lighting with smooth lerp transitions ─────── */

function SceneLights({ style }: { style: CameraStyle }) {
  const ambRef  = useRef<THREE.AmbientLight>(null);
  const keyRef  = useRef<THREE.DirectionalLight>(null);
  const rimRef  = useRef<THREE.DirectionalLight>(null);

  const tAmbColor = useMemo(() => new THREE.Color(style.ambientColor), [style.ambientColor]);
  const tKeyColor = useMemo(() => new THREE.Color(style.keyColor),     [style.keyColor]);
  const tRimColor = useMemo(() => new THREE.Color(style.rimColor),     [style.rimColor]);
  const tKeyPos   = useMemo(() => new THREE.Vector3(...style.keyPosition), [style.keyPosition]);

  useFrame(() => {
    const α = 0.06; // ~0.8 s lerp at 60 fps
    if (ambRef.current) {
      ambRef.current.color.lerp(tAmbColor, α);
      ambRef.current.intensity = THREE.MathUtils.lerp(ambRef.current.intensity, style.ambientIntensity, α);
    }
    if (keyRef.current) {
      keyRef.current.color.lerp(tKeyColor, α);
      keyRef.current.intensity = THREE.MathUtils.lerp(keyRef.current.intensity, style.keyIntensity, α);
      keyRef.current.position.lerp(tKeyPos, α);
    }
    if (rimRef.current) {
      rimRef.current.color.lerp(tRimColor, α);
      rimRef.current.intensity = THREE.MathUtils.lerp(rimRef.current.intensity, style.rimIntensity, α);
    }
  });

  // Rim sits opposite the key light
  const rimPos: [number, number, number] = [
    -style.keyPosition[0] * 0.5,
    Math.abs(style.keyPosition[1]) * 0.4 + 1,
    -style.keyPosition[2],
  ];

  return (
    <>
      <ambientLight     ref={ambRef} color={style.ambientColor} intensity={style.ambientIntensity} />
      <directionalLight ref={keyRef} color={style.keyColor}     intensity={style.keyIntensity}
                        position={style.keyPosition} castShadow />
      <directionalLight ref={rimRef} color={style.rimColor}     intensity={style.rimIntensity}
                        position={rimPos} />
    </>
  );
}

/* ── Scene fog + background driven by style ─────────── */

function SceneFog({ style }: { style: CameraStyle }) {
  const { scene } = useThree();
  useEffect(() => {
    scene.fog = new THREE.Fog(style.fogColor, style.fogNear, style.fogFar);
    scene.background = new THREE.Color(style.fogColor);
    return () => { scene.fog = null; scene.background = null; };
  }, [scene, style.fogColor, style.fogNear, style.fogFar]);
  return null;
}

/* ── Smooth camera position lerp ────────────────────── */

function CameraRig({ style }: { style: CameraStyle }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(...style.cameraPosition), [style.cameraPosition]);
  useFrame(() => { camera.position.lerp(target, 0.05); });
  return null;
}

/* ── Procedural 3D camera body (used for Olympus OM-1) ─ */

function CameraSculpture({ style }: { style: CameraStyle }) {
  const groupRef = useRef<Group>(null);

  const bodyMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color:     style.color    ?? '#222226',
      metalness: style.metalness ?? 0.45,
      roughness: style.roughness ?? 0.4,
    });
    if (style.emissive) {
      m.emissive.set(style.emissive);
      m.emissiveIntensity = style.emissiveIntensity;
    }
    m.needsUpdate = true;
    return m;
  }, [style]);

  const lensMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#16161a', metalness: 0.7, roughness: 0.2,
  }), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * style.autoRotateSpeed;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh material={bodyMat} castShadow>
        <boxGeometry args={[1.8, 1, 0.8]} />
      </mesh>
      {/* Lens barrel */}
      <mesh material={lensMat} position={[0.7, 0, 0.55]}>
        <cylinderGeometry args={[0.34, 0.34, 0.56, 64]} />
      </mesh>
      {/* Viewfinder hump */}
      <mesh material={bodyMat} position={[-0.25, 0.34, 0.45]}>
        <boxGeometry args={[0.5, 0.2, 0.2]} />
      </mesh>
    </group>
  );
}

/* ── FPS monitor — wired to runtimeDowngrade ──────────── */

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

/* ── Placeholder panel for cameras without a model ───── */

function CameraPlaceholder({
  camera,
  animate,
}: {
  camera: ArchiveCameraEntry;
  animate: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { style } = camera;

  useEffect(() => {
    if (!animate) {
      // Skip GSAP — set final state immediately
      if (ref.current) {
        ref.current.style.opacity = '1';
        ref.current.style.transform = 'none';
      }
      return;
    }
    gsap.from(ref.current, { opacity: 0, y: 16, duration: 0.55, ease: 'power3.out' });
  }, [camera.name, animate]);

  return (
    <div
      ref={ref}
      className="archive-placeholder"
      style={{ background: style.fogColor, color: style.placeholderTextColor }}
    >
      <span
        className="t-eyebrow archive-placeholder-year"
        style={{ color: style.placeholderAccent, opacity: 0.5, letterSpacing: '0.2em' }}
      >
        {camera.year}
      </span>

      <h3
        className="archive-placeholder-name"
        style={{ color: style.placeholderTextColor }}
      >
        {camera.name}
      </h3>

      <div
        className="archive-placeholder-line"
        style={{ background: style.placeholderAccent }}
      />

      <p
        className="archive-placeholder-descriptor"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          letterSpacing: '0.12em',
          color: style.placeholderTextColor,
          opacity: 0.4,
          marginTop: '0.25rem',
          textTransform: 'uppercase',
        }}
      >
        {style.descriptor}
      </p>
    </div>
  );
}

/* ── Main section ────────────────────────────────────── */

export default function ArchiveSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const active = CAMERAS[activeIndex];

  const { use3D, dpr, useHeavyAnimations, runtimeDowngrade } = usePerformance();
  const { inView, containerRef } = useInViewCanvas();

  const handleSelect = (i: number) => {
    if (i === activeIndex) return;
    if (!useHeavyAnimations) {
      // Skip GSAP transition on low/reduced-motion tier
      setActiveIndex(i);
      return;
    }
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

  // On low tier, always render placeholder (even for cameras with hasModel)
  const showCanvas = use3D && active.hasModel;

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
            className={`archive-list-item ${activeIndex === i ? 'archive-list-item--active' : ''}`}
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
        {showCanvas ? (
          <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <Canvas
              camera={{ fov: 45, position: active.style.cameraPosition }}
              dpr={dpr}
              gl={{ antialias: false, powerPreference: 'high-performance' }}
              frameloop={inView ? 'always' : 'never'}
              className="archive-canvas"
            >
              <FrameMonitor onDowngrade={runtimeDowngrade} />
              <SceneFog    style={active.style} />
              <CameraRig   style={active.style} />
              <SceneLights style={active.style} />
              <Suspense fallback={null}>
                <CameraSculpture style={active.style} />
              </Suspense>
              <OrbitControls
                enablePan={false}
                minPolarAngle={0.3}
                maxPolarAngle={Math.PI / 2}
              />
            </Canvas>
            <p className="archive-panel-hint t-eyebrow">— Drag to rotate —</p>
          </div>
        ) : (
          <CameraPlaceholder
            camera={active}
            key={active.name}
            animate={useHeavyAnimations}
          />
        )}
      </div>

    </section>
  );
}
