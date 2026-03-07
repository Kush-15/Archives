import { useRef, useState, Suspense, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useInViewCanvas } from '@/hooks/useInViewCanvas';
import CollectionSpec from '@/components/ui/CollectionSpec';

/* ─────────────────────────────────────────────────────────
   Camera data for the three collection pieces
   ───────────────────────────────────────────────────────── */

interface CameraData {
  id: string;
  name: string;
  year: number;
  color: string;
  specs: { label: string; value: string }[];
}

const CAMERAS: CameraData[] = [
  {
    id: 'om1',
    name: 'Olympus OM-1',
    year: 1972,
    color: '#1a1a1a',
    specs: [
      { label: 'Type', value: '35mm SLR' },
      { label: 'Lens Mount', value: 'OM Bayonet' },
      { label: 'Shutter', value: '1s – 1/1000s' },
      { label: 'Weight', value: '510g' },
    ],
  },
  {
    id: 'hasselblad',
    name: 'Hasselblad 500C',
    year: 1957,
    color: '#222222',
    specs: [
      { label: 'Type', value: 'Medium Format SLR' },
      { label: 'Film', value: '120 Roll Film' },
      { label: 'Shutter', value: '1s – 1/500s' },
      { label: 'Weight', value: '1100g' },
    ],
  },
  {
    id: 'leica',
    name: 'Leica M3',
    year: 1954,
    color: '#181818',
    specs: [
      { label: 'Type', value: '35mm Rangefinder' },
      { label: 'Lens Mount', value: 'M Bayonet' },
      { label: 'Shutter', value: '1s – 1/1000s' },
      { label: 'Weight', value: '580g' },
    ],
  },
];

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

  useEffect(() => {
    targetScale.current = isCenter ? 1.2 : 0.85;
  }, [isCenter]);

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: data.color,
        metalness: 0.85,
        roughness: 0.25,
        transparent: !isCenter,
        opacity: isCenter ? 1 : 0.3,
      }),
    [data.color, isCenter]
  );

  const silverMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#c0c0c0',
        metalness: 0.95,
        roughness: 0.15,
        transparent: !isCenter,
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

  useFrame(() => {
    if (!groupRef.current) return;
    // Spring toward target scale
    currentScale.current += (targetScale.current - currentScale.current) * 0.08;
    const s = currentScale.current;
    groupRef.current.scale.set(s, s, s);
    if (isCenter || isHovered) {
      groupRef.current.rotation.y += isHovered ? 0.02 : 0.006;
    }
  });

  const mat = xray && isCenter ? xrayMat : bodyMat;
  const sMat = xray && isCenter ? xrayMat : silverMat;

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
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Main body */}
      <mesh material={mat} castShadow>
        <boxGeometry args={[2.4, 1.5, 1.2]} />
      </mesh>
      {/* Top plate */}
      <mesh material={sMat} position={[0, 0.82, 0]}>
        <boxGeometry args={[2.5, 0.15, 1.22]} />
      </mesh>
      {/* Bottom plate */}
      <mesh material={sMat} position={[0, -0.82, 0]}>
        <boxGeometry args={[2.5, 0.15, 1.22]} />
      </mesh>
      {/* Lens */}
      <mesh
        material={mat}
        position={[0, -0.05, 0.9]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.5, 0.55, 0.7, 32]} />
      </mesh>
      {/* Viewfinder */}
      <mesh material={mat} position={[0, 1.05, 0]}>
        <boxGeometry args={[1.0, 0.3, 0.8]} />
      </mesh>

      {/* Hover label */}
      {isHovered && !isCenter && null}
    </group>
  );
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
}: {
  selectedIndex: number;
  hoveredIndex: number | null;
  onHoverIndex: (idx: number | null) => void;
  onSelect: (i: number) => void;
  xray: boolean;
}) {
  // Fixed slots: cameras stay in their original positions.
  const positions: [number, number, number][] = [
    [-3.5, 0, 0],
    [0, 0, 1],
    [3.5, 0, 0],
  ];

  return (
    <>
      <directionalLight position={[-5, 5, 5]} intensity={2.2} castShadow />
      <directionalLight position={[4, 1, 2]} intensity={0.22} />

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
            dpr={[1, 1.5]}
            frameloop={inView ? 'always' : 'never'}
            gl={{ antialias: false }}
            camera={{ position: [0, 1, 8], fov: 40 }}
          >
            <Suspense fallback={null}>
              <CollectionSceneInner
                selectedIndex={selectedIndex}
                hoveredIndex={hoveredIndex}
                onHoverIndex={setHoveredIndex}
                onSelect={handleSelect}
                xray={xray}
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
