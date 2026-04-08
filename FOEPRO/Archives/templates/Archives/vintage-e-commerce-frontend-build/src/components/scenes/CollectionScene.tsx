import { useRef, useState, Suspense, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { MeshPhysicalMaterial } from 'three';
import { useInViewCanvas } from '@/hooks/useInViewCanvas';
import CollectionSpec from '@/components/ui/CollectionSpec';
import { usePerformance } from '@/context/PerformanceContext';
import {
  recordFrame,
  shouldDowngradeTier,
} from '@/lib/product3d/tierDetection';

/* ─────────────────────────────────────────────────────────
   Camera data for the three collection pieces
   ───────────────────────────────────────────────────────── */

interface CameraData {
  id: string;
  name: string;
  year: number;
  color: string;
  metalness: number;
  roughness: number;
  specs: { label: string; value: string }[];
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

const CAMERAS: CameraData[] = [
  {
    id: 'om1',
    name: 'Olympus OM-1',
    year: 1972,
    color: '#1C1C1C',
    metalness: 0.35,
    roughness: 0.65,
    specs: [
      { label: 'Type', value: '35mm SLR' },
      { label: 'Lens Mount', value: 'OM Bayonet' },
      { label: 'Shutter', value: '1s – 1/1000s' },
      { label: 'Weight', value: '510g' },
    ],
    // Real OM-1: matte black leatherette + brushed chrome top/bottom
    bodyColor: '#1A1A18',
    bodyMetalness: 0.0,
    bodyRoughness: 0.85,
    chromeColor: '#C8C8C8',
    chromeMetalness: 0.95,
    chromeRoughness: 0.25,
    lensBarrelColor: '#111111',
    lensBarrelMetalness: 0.8,
    lensBarrelRoughness: 0.15,
  },
  {
    id: 'hasselblad',
    name: 'Hasselblad 500C',
    year: 1957,
    color: '#101010',
    metalness: 0.82,
    roughness: 0.18,
    specs: [
      { label: 'Type', value: 'Medium Format SLR' },
      { label: 'Film', value: '120 Roll Film' },
      { label: 'Shutter', value: '1s – 1/500s' },
      { label: 'Weight', value: '1100g' },
    ],
    // Real Hasselblad 500C: dark magnesium body + polished chrome front plate
    bodyColor: '#1E1E1E',
    bodyMetalness: 0.2,
    bodyRoughness: 0.75,
    chromeColor: '#D0D0D0',
    chromeMetalness: 0.96,
    chromeRoughness: 0.18,
    lensBarrelColor: '#0A0A0A',
    lensBarrelMetalness: 0.85,
    lensBarrelRoughness: 0.12,
  },
  {
    id: 'leica',
    name: 'Leica M3',
    year: 1954,
    color: '#1A120A',
    metalness: 0.55,
    roughness: 0.38,
    specs: [
      { label: 'Type', value: '35mm Rangefinder' },
      { label: 'Lens Mount', value: 'M Bayonet' },
      { label: 'Shutter', value: '1s – 1/1000s' },
      { label: 'Weight', value: '580g' },
    ],
    // Real Leica M3: polished chrome body + warm black vulcanite leatherette
    bodyColor: '#1C1814',
    bodyMetalness: 0.0,
    bodyRoughness: 0.8,
    chromeColor: '#D4D4D8',
    chromeMetalness: 0.98,
    chromeRoughness: 0.12,
    lensBarrelColor: '#0A0A0A',
    lensBarrelMetalness: 0.85,
    lensBarrelRoughness: 0.1,
  },
];

/* ─────────────────────────────────────────────────────────
   Low-tier static poster fallback
   No Canvas, no three.js download required.
   ───────────────────────────────────────────────────────── */

function CollectionScenePoster() {
  return (
    <section
      className="collection-act"
      id="collection"
      data-cursor-zone="dark"
    >
      <div className="collection-title">
        <div className="typo-label" style={{ opacity: 0.4, marginBottom: '1.5rem' }}>
          Act III
        </div>
        <h2 className="typo-section">The Collection</h2>
      </div>

      {/* Static camera cards — on-brand, no WebGL */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          padding: '3rem 2rem 4rem',
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        {CAMERAS.map((cam) => (
          <div
            key={cam.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              padding: '1.5rem',
              border: '1px solid rgba(248,247,244,0.08)',
              borderRadius: '2px',
            }}
          >
            {/* Camera silhouette — purely decorative SVG rectangle */}
            <div
              aria-hidden="true"
              style={{
                width: '100%',
                aspectRatio: '4/3',
                background: cam.color,
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7,
              }}
            >
              <div
                style={{
                  width: '60%',
                  height: '50%',
                  border: `1px solid rgba(${cam.metalness > 0.5 ? '200,200,200' : '255,255,255'},0.25)`,
                  borderRadius: '1px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '25%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '28%',
                    aspectRatio: '1',
                    borderRadius: '50%',
                    border: `1px solid rgba(${cam.metalness > 0.5 ? '180,180,180' : '255,255,255'},0.3)`,
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#F8F7F4', marginBottom: '0.25rem' }}>
                {cam.name}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.55rem', letterSpacing: '0.15em', opacity: 0.4 }}>
                {cam.year}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {cam.specs.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    letterSpacing: '0.08em',
                    color: 'rgba(248,247,244,0.6)',
                    borderBottom: '1px solid rgba(248,247,244,0.06)',
                    paddingBottom: '0.3rem',
                  }}
                >
                  <span style={{ opacity: 0.5 }}>{s.label}</span>
                  <span>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   Procedural camera mesh for collection
   ───────────────────────────────────────────────────────── */

function CollectionCamera({
  data,
  position,
  isCenter,
  onClick,
  isHovered,
  onHover,
  xray,
}: {
  data: CameraData;
  position: [number, number, number];
  isCenter: boolean;
  onClick: () => void;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  xray: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetScale = useRef(isCenter ? 1.2 : 0.85);
  const currentScale = useRef(isCenter ? 1.2 : 0.85);

  // Drag-to-rotate state for selected model
  const isDragging = useRef(false);
  const dragDistance = useRef(0);
  const prevPointer = useRef({ x: 0, y: 0 });
  const userRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    targetScale.current = isCenter ? 1.2 : 0.85;
    // Reset user rotation when model becomes selected
    if (isCenter) {
      userRotation.current = { x: 0, y: 0 };
    }
  }, [isCenter]);

  /* ── Authentic PBR materials per camera zone ── */

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: data.bodyColor,
        metalness: data.bodyMetalness,
        roughness: data.bodyRoughness,
        envMapIntensity: 0.6,
        transparent: !isCenter,
        opacity: isCenter ? 1 : 0.3,
      }),
    [data.bodyColor, data.bodyMetalness, data.bodyRoughness, isCenter]
  );

  const chromeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: data.chromeColor,
        metalness: data.chromeMetalness,
        roughness: data.chromeRoughness,
        envMapIntensity: 0.8,
        transparent: !isCenter,
        opacity: isCenter ? 1 : 0.3,
      }),
    [data.chromeColor, data.chromeMetalness, data.chromeRoughness, isCenter]
  );

  const lensBarrelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: data.lensBarrelColor,
        metalness: data.lensBarrelMetalness,
        roughness: data.lensBarrelRoughness,
        envMapIntensity: 0.7,
        transparent: !isCenter,
        opacity: isCenter ? 1 : 0.3,
      }),
    [data.lensBarrelColor, data.lensBarrelMetalness, data.lensBarrelRoughness, isCenter]
  );

  const lensMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#FFFFFF',
        metalness: 0.0,
        roughness: 0.0,
        transmission: isCenter ? 0.95 : 0.4,
        ior: 1.52,
        thickness: 0.5,
        transparent: true,
        opacity: isCenter ? 1 : 0.3,
      }),
    [isCenter]
  );

  const xrayMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      }),
    []
  );

  useFrame(({ clock, invalidate }) => {
    if (!groupRef.current) return;
    // Spring toward target scale
    currentScale.current += (targetScale.current - currentScale.current) * 0.08;
    const s = currentScale.current;
    groupRef.current.scale.set(s, s, s);

    if (isCenter) {
      // Selected model: user drag controls rotation (no auto-rotate)
      groupRef.current.rotation.y = userRotation.current.y;
      groupRef.current.rotation.x = userRotation.current.x;
    } else {
      // Unselected models: systematic auto-rotate
      groupRef.current.rotation.y = clock.elapsedTime * 0.4;
    }
    invalidate();
  });

  const handlePointerDown = useCallback((e: { clientX: number; clientY: number; stopPropagation: () => void }) => {
    if (!isCenter) return;
    isDragging.current = true;
    dragDistance.current = 0;
    e.stopPropagation();
    prevPointer.current = { x: e.clientX, y: e.clientY };
  }, [isCenter]);

  // Window-level move/up for smooth drag even when cursor leaves mesh
  useEffect(() => {
    if (!isCenter) return;

    const onMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - prevPointer.current.x;
      const dy = e.clientY - prevPointer.current.y;
      dragDistance.current += Math.abs(dx) + Math.abs(dy);
      userRotation.current.y += dx * 0.008;
      userRotation.current.x += dy * 0.005;
      userRotation.current.x = Math.max(-0.5, Math.min(0.5, userRotation.current.x));
      prevPointer.current = { x: e.clientX, y: e.clientY };
    };

    const onUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isCenter]);

  const bMat = xray && isCenter ? xrayMat : bodyMat;
  const cMat = xray && isCenter ? xrayMat : chromeMat;
  const lbMat = xray && isCenter ? xrayMat : lensBarrelMat;
  const lMat = xray && isCenter ? xrayMat : lensMat;

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(false);
      }}
      onClick={(e) => {
        if (dragDistance.current > 5) return; // Was a drag, not a click
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => {
        handlePointerDown(e);
      }}
    >
      {/* ── Olympus OM-1 — compact 35mm SLR with pentaprism hump ── */}
      {data.id === 'om1' && <>
        <mesh material={bMat} castShadow receiveShadow>
          <boxGeometry args={[1.9, 1.05, 0.9]} />
        </mesh>
        {/* Pentaprism hump */}
        <mesh material={bMat} position={[0.08, 0.73, 0.02]} castShadow>
          <boxGeometry args={[0.88, 0.34, 0.78]} />
        </mesh>
        {/* Top plate — chrome */}
        <mesh material={cMat} position={[0, 0.59, 0]} castShadow>
          <boxGeometry args={[1.95, 0.12, 0.92]} />
        </mesh>
        {/* Bottom plate — chrome */}
        <mesh material={cMat} position={[0, -0.59, 0]} castShadow>
          <boxGeometry args={[1.95, 0.12, 0.92]} />
        </mesh>
        {/* Lens barrel — dark metal */}
        <mesh material={lbMat} position={[-0.08, -0.04, 0.76]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.32, 0.56, 32]} />
        </mesh>
        {/* Lens glass */}
        <mesh material={lMat} position={[-0.08, -0.04, 1.08]}>
          <sphereGeometry args={[0.22, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {/* Focus ring */}
        <mesh material={cMat} position={[-0.08, -0.04, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.33, 0.02, 8, 24]} />
        </mesh>
        {/* Film advance lever */}
        <mesh material={cMat} position={[0.8, 0.66, 0]} castShadow>
          <boxGeometry args={[0.13, 0.07, 0.16]} />
        </mesh>
      </>}

      {/* ── Hasselblad 500C — nearly square medium-format SLR ── */}
      {data.id === 'hasselblad' && <>
        {/* Main body — tall and square */}
        <mesh material={bMat} castShadow receiveShadow>
          <boxGeometry args={[1.6, 1.65, 1.15]} />
        </mesh>
        {/* Film magazine — block on the back */}
        <mesh material={bMat} position={[0, 0, -0.88]} castShadow>
          <boxGeometry args={[1.56, 1.6, 0.6]} />
        </mesh>
        {/* Waist-level finder box on top */}
        <mesh material={bMat} position={[0, 1.02, 0.1]} castShadow>
          <boxGeometry args={[1.5, 0.38, 0.62]} />
        </mesh>
        {/* Front plate (chrome) */}
        <mesh material={cMat} position={[0, 0, 0.63]} castShadow>
          <boxGeometry args={[1.62, 1.67, 0.1]} />
        </mesh>
        {/* Wide lens barrel */}
        <mesh material={lbMat} position={[0, 0.08, 0.9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.44, 0.48, 0.58, 32]} />
        </mesh>
        {/* Lens glass */}
        <mesh material={lMat} position={[0, 0.08, 1.24]}>
          <sphereGeometry args={[0.34, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {/* Focus ring */}
        <mesh material={cMat} position={[0, 0.08, 0.82]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.47, 0.025, 8, 24]} />
        </mesh>
      </>}

      {/* ── Leica M3 — wide flat rangefinder, no hump ── */}
      {data.id === 'leica' && <>
        {/* Body — wide and low */}
        <mesh material={bMat} castShadow receiveShadow>
          <boxGeometry args={[2.3, 0.92, 0.68]} />
        </mesh>
        {/* Top plate (chrome) */}
        <mesh material={cMat} position={[0, 0.52, 0]} castShadow>
          <boxGeometry args={[2.34, 0.12, 0.7]} />
        </mesh>
        {/* Bottom plate (chrome) */}
        <mesh material={cMat} position={[0, -0.52, 0]} castShadow>
          <boxGeometry args={[2.34, 0.12, 0.7]} />
        </mesh>
        {/* Lens barrel — dark metal */}
        <mesh material={lbMat} position={[-0.42, 0.04, 0.55]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.24, 0.44, 32]} />
        </mesh>
        {/* Lens glass */}
        <mesh material={lMat} position={[-0.42, 0.04, 0.8]}>
          <sphereGeometry args={[0.17, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {/* Focus ring */}
        <mesh material={cMat} position={[-0.42, 0.04, 0.48]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.25, 0.018, 8, 24]} />
        </mesh>
        {/* Rangefinder window — chrome */}
        <mesh material={cMat} position={[0.52, 0.08, 0.36]} castShadow>
          <boxGeometry args={[0.2, 0.11, 0.04]} />
        </mesh>
        {/* Viewfinder window — chrome */}
        <mesh material={cMat} position={[0.82, 0.08, 0.36]} castShadow>
          <boxGeometry args={[0.13, 0.09, 0.04]} />
        </mesh>
      </>}

      {/* Hover label */}
      {isHovered && !isCenter && null}
    </group>
  );
}

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
   Three cameras in scene
   ───────────────────────────────────────────────────────── */

function CollectionSceneInner({
  selectedIndex,
  hoveredIndex,
  onHoverIndex,
  onSelect,
  xray,
  shadowLights,
}: {
  selectedIndex: number;
  hoveredIndex: number | null;
  onHoverIndex: (idx: number | null) => void;
  onSelect: (i: number) => void;
  xray: boolean;
  shadowLights: number;
}) {
  const { size } = useThree();
  const isCompact = size.width < 1100;

  // Keep the trio centered while avoiding overlap with the right spec panel.
  const positions: [number, number, number][] = isCompact
    ? [
        [-2.2, 0.1, 0.0],
        [-0.15, 0.24, 1.0],
        [1.85, 0.1, 0.0],
      ]
    : [
        [-3.9, 0.08, 0.0],
        [-0.45, 0.24, 1.05],
        [2.95, 0.08, 0.0],
      ];

  return (
    <>
      {/* ── Three-point studio lighting ── */}

      {/* Key light — warm, dramatic form definition */}
      <directionalLight
        position={[-4, 6, 4]}
        intensity={1.4}
        color="#FFF8F0"
        castShadow={shadowLights >= 1}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Fill light — cool, lifts shadows */}
      <directionalLight
        position={[5, 2, 3]}
        intensity={0.4}
        color="#E0E8FF"
        castShadow={false}
      />

      {/* Rim light — backlight, separates models from background */}
      <directionalLight
        position={[0, 3, -5]}
        intensity={0.5}
        color="#CCDDFF"
        castShadow={false}
      />

      {/* Ambient — prevents pure black in deep shadows */}
      <ambientLight intensity={0.15} color="#FFFFFF" />

      {/* ── Environment + Post-processing ── */}
      <Environment preset="studio" background={false} />

      <ContactShadows
        position={[0, -1.0, 0]}
        opacity={0.5}
        scale={12}
        blur={2.5}
        far={1.2}
      />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.85}
          intensity={0.15}
          radius={0.6}
        />
      </EffectComposer>

      {CAMERAS.map((cam, i) => (
        <CollectionCamera
          key={cam.id}
          data={cam}
          position={positions[i]}
          isCenter={i === selectedIndex}
          onClick={() => onSelect(i)}
          isHovered={hoveredIndex === i}
          onHover={(hovered) => onHoverIndex(hovered ? i : null)}
          xray={xray}
        />
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Exported — Act III Collection
   ───────────────────────────────────────────────────────── */

export default function CollectionScene() {
  const { use3D, dpr, maxShadowLights, runtimeDowngrade } = usePerformance();

  // Low tier: serve static poster — three.js never runs
  if (!use3D) return <CollectionScenePoster />;

  return <CollectionSceneCanvas dpr={dpr} maxShadowLights={maxShadowLights} runtimeDowngrade={runtimeDowngrade} />;
}

function CollectionSceneCanvas({
  dpr,
  maxShadowLights,
  runtimeDowngrade,
}: {
  dpr: [number, number];
  maxShadowLights: number;
  runtimeDowngrade: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [xray, setXray] = useState(false);
  const [specOpen, setSpecOpen] = useState(true);
  const { inView, containerRef } = useInViewCanvas();

  const selectedCamera = CAMERAS[selectedIndex];

  // X key toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'x' || e.key === 'X') {
        setXray((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSelect = useCallback(
    (i: number) => {
      setSelectedIndex(i);
      setSpecOpen(true);
      setXray(false);
    },
    []
  );

  return (
    <section
      className="collection-act"
      id="collection"
      data-cursor-zone="dark"
    >
      <div className="collection-title">
        <div className="typo-label" style={{ opacity: 0.4, marginBottom: '1.5rem' }}>
          Act III
        </div>
        <h2 className="typo-section">The Collection</h2>
      </div>

      <div className="collection-stage" ref={containerRef}>
        <div className="collection-canvas-wrap" data-cursor="grab">
          <Canvas
            dpr={dpr}
            frameloop={inView ? 'demand' : 'never'}
            gl={{ antialias: false }}
            camera={{ position: [0, 1, 8], fov: 40 }}
          >
            <Suspense fallback={null}>
              <FrameMonitor onDowngrade={runtimeDowngrade} />
              <CollectionSceneInner
                selectedIndex={selectedIndex}
                hoveredIndex={hoveredIndex}
                onHoverIndex={setHoveredIndex}
                onSelect={handleSelect}
                xray={xray}
                shadowLights={maxShadowLights}
              />
            </Suspense>
          </Canvas>
        </div>

        <CollectionSpec
          camera={selectedCamera}
          isOpen={specOpen}
          xrayActive={xray}
          onToggleXray={() => setXray((p) => !p)}
        />

        {/* Camera name labels at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '2rem',
            right: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            zIndex: 4,
            pointerEvents: 'none',
          }}
        >
          {CAMERAS.map((cam, i) => (
            <button
              key={cam.id}
              onClick={() => handleSelect(i)}
              style={{
                pointerEvents: 'auto',
                background: 'none',
                border: 'none',
                color:
                  i === selectedIndex
                    ? '#F8F7F4'
                    : 'rgba(248, 247, 244, 0.35)',
                fontFamily: 'var(--font-display)',
                fontSize: i === selectedIndex ? '1.1rem' : '0.9rem',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              aria-label={`Select ${cam.name}`}
            >
              <span>{cam.name}</span>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.55rem',
                  letterSpacing: '0.15em',
                  opacity: 0.5,
                  marginTop: '0.3rem',
                }}
              >
                {cam.year}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
