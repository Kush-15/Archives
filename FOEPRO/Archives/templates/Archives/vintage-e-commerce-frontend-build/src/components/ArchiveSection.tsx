import { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { MeshPhysicalMaterial } from 'three';
import type { Group } from 'three';
// materialZoneDetection no longer used – materials assigned directly in JSX
import gsap from 'gsap';
import { useInViewCanvas } from '@/hooks/useInViewCanvas';
import { usePerformance } from '@/context/PerformanceContext';
import { recordFrame, shouldDowngradeTier } from '@/lib/product3d/tierDetection';

/* ── Types ──────────────────────────────────────────────── */

interface CameraStyle {
  // Existing fields (keep as-is)
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

  // NEW: Environment & Material Profiles
  environmentPreset: 'studio' | 'city' | 'dawn' | 'sunset' | 'warehouse';
  environmentIntensity: number;

  // NEW: Body Material (matte paint, leather, plastic)
  bodyColor: string;
  bodyMetalness: number;
  bodyRoughness: number;

  // NEW: Chrome Material (polished metal, brushed metal, anodized aluminum)
  chromeColor: string;
  chromeMetalness: number;
  chromeRoughness: number;

  // NEW: Lens Barrel Material (opaque metal)
  lensBarrelColor: string;
  lensBarrelMetalness: number;
  lensBarrelRoughness: number;
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
    name: 'Olympus OM-1',
    year: 1972,
    hasModel: true,
    style: {
      // Original fields
      ambientIntensity: 0.3,
      ambientColor: '#FFFFFF',
      keyIntensity: 2.2,
      keyColor: '#FFF5E6',
      keyPosition: [-4, 6, 3],
      rimIntensity: 0.8,
      rimColor: '#C8C8FF',
      cameraPosition: [0, 0.3, 3.2],
      cameraTarget: [0, 0, 0],
      fogColor: '#0A0A0A',
      fogNear: 6,
      fogFar: 14,
      autoRotateSpeed: 0.6,
      autoRotateAxis: 'y',
      roughness: 0.7,
      metalness: 0.4,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#5C6EFF',
      placeholderTextColor: '#F8F7F4',
      descriptor: 'Matte black body. Mechanical precision.',
      // NEW: Material profiles (real Olympus OM-1 = matte black leatherette + brushed chrome)
      environmentPreset: 'studio',
      environmentIntensity: 0.7,
      bodyColor: '#1A1A18', // Deep warm black (leatherette)
      bodyMetalness: 0.0, // Not metallic (paint/leather)
      bodyRoughness: 0.85, // Very rough (cloth texture)
      chromeColor: '#C8C8C8', // Cool silver-grey (brushed chrome)
      chromeMetalness: 0.95, // Nearly full metal
      chromeRoughness: 0.25, // Semi-polished brush finish
      lensBarrelColor: '#111111', // Darker metal
      lensBarrelMetalness: 0.8,
      lensBarrelRoughness: 0.15,
    },
  },
  {
    name: 'Leica M6',
    year: 1984,
    hasModel: false,
    style: {
      ambientIntensity: 0.2,
      ambientColor: '#FFF8F0',
      keyIntensity: 2.8,
      keyColor: '#FFFAF5',
      keyPosition: [3, 8, 2],
      rimIntensity: 0.4,
      rimColor: '#FFE8C8',
      cameraPosition: [0.5, 0.2, 3.0],
      cameraTarget: [0, 0, 0],
      fogColor: '#080808',
      fogNear: 5,
      fogFar: 12,
      autoRotateSpeed: 0.4,
      autoRotateAxis: 'y',
      roughness: 0.3,
      metalness: 0.8,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#C9A96E',
      placeholderTextColor: '#F8F7F4',
      descriptor: 'German precision. 0.72× viewfinder.',
      // Real Leica M6 = polished chrome rangefinder + lacquered top
      environmentPreset: 'city',
      environmentIntensity: 0.65,
      bodyColor: '#1C1814', // Warm dark leather
      bodyMetalness: 0.0,
      bodyRoughness: 0.8,
      chromeColor: '#D0D0D0', // Brighter polish (Leica signature)
      chromeMetalness: 0.98,
      chromeRoughness: 0.15,
      lensBarrelColor: '#0A0A0A', // Very dark (polished black metal)
      lensBarrelMetalness: 0.85,
      lensBarrelRoughness: 0.1,
    },
  },
  {
    name: 'Nikon F3',
    year: 1980,
    hasModel: false,
    style: {
      ambientIntensity: 0.4,
      ambientColor: '#E8F0FF',
      keyIntensity: 2.0,
      keyColor: '#F0F5FF',
      keyPosition: [-6, 4, 4],
      rimIntensity: 1.2,
      rimColor: '#8899FF',
      cameraPosition: [-0.3, 0, 3.4],
      cameraTarget: [0, 0, 0],
      fogColor: '#060810',
      fogNear: 6,
      fogFar: 16,
      autoRotateSpeed: 0.5,
      autoRotateAxis: 'y',
      roughness: 0.5,
      metalness: 0.6,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#8899FF',
      placeholderTextColor: '#E8F0FF',
      descriptor: 'Giugiaro design. Titanium shutter.',
      // Real Nikon F3 = titanium shutter (cooler grey) + polished steel
      environmentPreset: 'dawn',
      environmentIntensity: 0.7,
      bodyColor: '#1F1F1F', // Cool dark grey-black
      bodyMetalness: 0.15, // Slight metallic hint (titanium)
      bodyRoughness: 0.7,
      chromeColor: '#B8B8B8', // Cool silver (less warm than Olympus)
      chromeMetalness: 0.92,
      chromeRoughness: 0.2,
      lensBarrelColor: '#1A1A1A',
      lensBarrelMetalness: 0.8,
      lensBarrelRoughness: 0.12,
    },
  },
  {
    name: 'Canon AE-1',
    year: 1976,
    hasModel: false,
    style: {
      ambientIntensity: 0.5,
      ambientColor: '#FFE8CC',
      keyIntensity: 1.8,
      keyColor: '#FFD080',
      keyPosition: [4, 5, 2],
      rimIntensity: 0.6,
      rimColor: '#FF8844',
      cameraPosition: [0.2, -0.1, 3.6],
      cameraTarget: [0, 0, 0],
      fogColor: '#120800',
      fogNear: 7,
      fogFar: 18,
      autoRotateSpeed: 0.8,
      autoRotateAxis: 'y',
      roughness: 0.8,
      metalness: 0.2,
      color: null,
      emissive: '#200800',
      emissiveIntensity: 0.05,
      placeholderAccent: '#FFD080',
      placeholderTextColor: '#FFE8CC',
      descriptor: 'Program AE. 1 million sold.',
      // Real Canon AE-1 = black ABS plastic body + anodized aluminum
      environmentPreset: 'sunset',
      environmentIntensity: 0.5, // Lower intensity (warm key light should dominate)
      bodyColor: '#0F0F0F', // Pure black plastic
      bodyMetalness: 0.0,
      bodyRoughness: 0.9, // Very matte plastic
      chromeColor: '#A8A8A8', // Duller silver (anodized aluminum)
      chromeMetalness: 0.7,
      chromeRoughness: 0.35,
      lensBarrelColor: '#0D0D0D',
      lensBarrelMetalness: 0.6,
      lensBarrelRoughness: 0.2,
    },
  },
  {
    name: 'Contax RTS',
    year: 1975,
    hasModel: false,
    style: {
      ambientIntensity: 0.6,
      ambientColor: '#F0F0F0',
      keyIntensity: 1.6,
      keyColor: '#FFFFFF',
      keyPosition: [0, 8, 2],
      rimIntensity: 0.3,
      rimColor: '#CCCCCC',
      cameraPosition: [0, 0.4, 3.0],
      cameraTarget: [0, 0, 0],
      fogColor: '#111111',
      fogNear: 5,
      fogFar: 12,
      autoRotateSpeed: 0.35,
      autoRotateAxis: 'y',
      roughness: 0.4,
      metalness: 0.7,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#CCCCCC',
      placeholderTextColor: '#F0F0F0',
      descriptor: 'Zeiss optics. Stuttgart, 1975.',
      // Real Contax RTS = light grey metal + polished chrome
      environmentPreset: 'studio',
      environmentIntensity: 0.65,
      bodyColor: '#2A2A2A', // Dark grey (metal)
      bodyMetalness: 0.3,
      bodyRoughness: 0.65,
      chromeColor: '#D8D8D8', // Bright chrome
      chromeMetalness: 0.96,
      chromeRoughness: 0.18,
      lensBarrelColor: '#1C1C1C',
      lensBarrelMetalness: 0.85,
      lensBarrelRoughness: 0.15,
    },
  },
  {
    name: 'Hasselblad 500CM',
    year: 1970,
    hasModel: false,
    style: {
      ambientIntensity: 0.15,
      ambientColor: '#FFFFFF',
      keyIntensity: 2.4,
      keyColor: '#FFFFFF',
      keyPosition: [0, -3, 2],
      rimIntensity: 1.0,
      rimColor: '#AACCFF',
      cameraPosition: [0, 0.6, 2.8],
      cameraTarget: [0, 0.1, 0],
      fogColor: '#040408',
      fogNear: 4,
      fogFar: 10,
      autoRotateSpeed: 0.25,
      autoRotateAxis: 'y',
      roughness: 0.6,
      metalness: 0.5,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#AACCFF',
      placeholderTextColor: '#FFFFFF',
      descriptor: 'Medium format. Flew to the moon.',
      // Real Hasselblad 500CM = brushed magnesium alloy + chrome
      environmentPreset: 'warehouse',
      environmentIntensity: 0.65,
      bodyColor: '#242424', // Dark magnesium (industrial)
      bodyMetalness: 0.25,
      bodyRoughness: 0.75, // Brushed finish
      chromeColor: '#C0C0C0', // Matte chrome
      chromeMetalness: 0.93,
      chromeRoughness: 0.3, // More brushed
      lensBarrelColor: '#0F0F0F',
      lensBarrelMetalness: 0.75,
      lensBarrelRoughness: 0.2,
    },
  },
  {
    name: 'Rolleiflex 2.8F',
    year: 1960,
    hasModel: false,
    style: {
      ambientIntensity: 0.35,
      ambientColor: '#FFE0A0',
      keyIntensity: 1.9,
      keyColor: '#FFCC66',
      keyPosition: [3, 4, 5],
      rimIntensity: 0.5,
      rimColor: '#FF9944',
      cameraPosition: [0.4, 0.3, 3.2],
      cameraTarget: [0, 0, 0],
      fogColor: '#110800',
      fogNear: 6,
      fogFar: 14,
      autoRotateSpeed: 0.4,
      autoRotateAxis: 'y',
      roughness: 0.75,
      metalness: 0.25,
      color: null,
      emissive: '#180800',
      emissiveIntensity: 0.04,
      placeholderAccent: '#FFCC66',
      placeholderTextColor: '#FFE0A0',
      descriptor: 'Twin lens reflex. Planar 80mm.',
      // Real Rolleiflex = warm leather + dull chrome (1960s)
      environmentPreset: 'studio',
      environmentIntensity: 0.6,
      bodyColor: '#1F1814', // Warm brown leather
      bodyMetalness: 0.0,
      bodyRoughness: 0.88,
      chromeColor: '#BCBCBC', // Duller (older patina)
      chromeMetalness: 0.85,
      chromeRoughness: 0.4,
      lensBarrelColor: '#161610',
      lensBarrelMetalness: 0.7,
      lensBarrelRoughness: 0.25,
    },
  },
  {
    name: 'Voigtländer Bessa',
    year: 1950,
    hasModel: false,
    style: {
      ambientIntensity: 0.45,
      ambientColor: '#FFF5E0',
      keyIntensity: 1.7,
      keyColor: '#FFE8B0',
      keyPosition: [2, 5, 3],
      rimIntensity: 0.4,
      rimColor: '#CC9944',
      cameraPosition: [0, 0.2, 3.4],
      cameraTarget: [0, 0, 0],
      fogColor: '#0E0A04',
      fogNear: 6,
      fogFar: 14,
      autoRotateSpeed: 0.45,
      autoRotateAxis: 'y',
      roughness: 0.6,
      metalness: 0.5,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#FF6B6B',
      placeholderTextColor: '#FFF5E0',
      descriptor: 'Folding rangefinder. Postwar Germany.',
      // Real Voigtländer Bessa = leather wrapped + dull metal (postwar)
      environmentPreset: 'studio',
      environmentIntensity: 0.6,
      bodyColor: '#2A2420', // Warm grey leather
      bodyMetalness: 0.05,
      bodyRoughness: 0.85,
      chromeColor: '#B0B0B0', // Old patinated chrome
      chromeMetalness: 0.8,
      chromeRoughness: 0.45,
      lensBarrelColor: '#151510',
      lensBarrelMetalness: 0.65,
      lensBarrelRoughness: 0.3,
    },
  },
  {
    name: 'Minolta X-700',
    year: 1981,
    hasModel: false,
    style: {
      ambientIntensity: 0.4,
      ambientColor: '#F0F4FF',
      keyIntensity: 1.9,
      keyColor: '#E8F0FF',
      keyPosition: [-3, 6, 3],
      rimIntensity: 0.5,
      rimColor: '#4444AA',
      cameraPosition: [0, 0, 3.5],
      cameraTarget: [0, 0, 0],
      fogColor: '#080810',
      fogNear: 6,
      fogFar: 14,
      autoRotateSpeed: 0.55,
      autoRotateAxis: 'y',
      roughness: 0.55,
      metalness: 0.55,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#4ECDC4',
      placeholderTextColor: '#F0F4FF',
      descriptor: 'Program mode. Last of the greats.',
      // Real Minolta X-700 = black polymer + anodized aluminum
      environmentPreset: 'studio',
      environmentIntensity: 0.65,
      bodyColor: '#141414', // Pure black polymer
      bodyMetalness: 0.0,
      bodyRoughness: 0.92,
      chromeColor: '#A0A0A0', // Anodized (dull)
      chromeMetalness: 0.75,
      chromeRoughness: 0.38,
      lensBarrelColor: '#0C0C0C',
      lensBarrelMetalness: 0.65,
      lensBarrelRoughness: 0.22,
    },
  },
  {
    name: 'Pentax K1000',
    year: 1976,
    hasModel: false,
    style: {
      ambientIntensity: 0.5,
      ambientColor: '#F8F8F8',
      keyIntensity: 1.6,
      keyColor: '#FFFFFF',
      keyPosition: [3, 5, 3],
      rimIntensity: 0.3,
      rimColor: '#AAAAAA',
      cameraPosition: [0, 0, 3.6],
      cameraTarget: [0, 0, 0],
      fogColor: '#0C0C0C',
      fogNear: 6,
      fogFar: 14,
      autoRotateSpeed: 0.6,
      autoRotateAxis: 'y',
      roughness: 0.7,
      metalness: 0.3,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#FFE66D',
      placeholderTextColor: '#F8F8F8',
      descriptor: 'All-mechanical. Student camera.',
      // Real Pentax K1000 = black painted metal + chrome
      environmentPreset: 'studio',
      environmentIntensity: 0.65,
      bodyColor: '#1A1A1A', // Deep black paint
      bodyMetalness: 0.05,
      bodyRoughness: 0.8,
      chromeColor: '#C4C4C4', // Polished chrome
      chromeMetalness: 0.94,
      chromeRoughness: 0.22,
      lensBarrelColor: '#0E0E0E',
      lensBarrelMetalness: 0.78,
      lensBarrelRoughness: 0.18,
    },
  },
  {
    name: 'Yashica Electro 35',
    year: 1966,
    hasModel: false,
    style: {
      ambientIntensity: 0.4,
      ambientColor: '#FFF0E8',
      keyIntensity: 1.8,
      keyColor: '#FFE0CC',
      keyPosition: [4, 4, 4],
      rimIntensity: 0.4,
      rimColor: '#CC6644',
      cameraPosition: [0.1, 0, 3.5],
      cameraTarget: [0, 0, 0],
      fogColor: '#100806',
      fogNear: 6,
      fogFar: 14,
      autoRotateSpeed: 0.5,
      autoRotateAxis: 'y',
      roughness: 0.65,
      metalness: 0.4,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#A8E6CF',
      placeholderTextColor: '#FFF0E8',
      descriptor: 'Aperture priority. 1966.',
      // Real Yashica Electro 35 = warm leather + dull chrome
      environmentPreset: 'studio',
      environmentIntensity: 0.62,
      bodyColor: '#1F1916', // Warm leather brown
      bodyMetalness: 0.0,
      bodyRoughness: 0.87,
      chromeColor: '#B4B4B4', // Dull chrome (1960s)
      chromeMetalness: 0.82,
      chromeRoughness: 0.42,
      lensBarrelColor: '#121210',
      lensBarrelMetalness: 0.68,
      lensBarrelRoughness: 0.28,
    },
  },
  {
    name: 'Mamiya RB67',
    year: 1970,
    hasModel: false,
    style: {
      ambientIntensity: 0.3,
      ambientColor: '#F0F0E8',
      keyIntensity: 2.0,
      keyColor: '#FFFFFF',
      keyPosition: [-2, 7, 2],
      rimIntensity: 0.4,
      rimColor: '#888888',
      cameraPosition: [0.2, 0.4, 3.0],
      cameraTarget: [0, 0, 0],
      fogColor: '#0A0A08',
      fogNear: 5,
      fogFar: 12,
      autoRotateSpeed: 0.3,
      autoRotateAxis: 'y',
      roughness: 0.6,
      metalness: 0.5,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#FF8B94',
      placeholderTextColor: '#F0F0E8',
      descriptor: 'Studio medium format. Rotating back.',
      // Real Mamiya RB67 = dark leather + chrome accents
      environmentPreset: 'studio',
      environmentIntensity: 0.65,
      bodyColor: '#232320', // Dark leather
      bodyMetalness: 0.0,
      bodyRoughness: 0.84,
      chromeColor: '#BFBFBF', // Polished
      chromeMetalness: 0.91,
      chromeRoughness: 0.25,
      lensBarrelColor: '#0F0F0D',
      lensBarrelMetalness: 0.8,
      lensBarrelRoughness: 0.16,
    },
  },
  {
    name: 'Bronica ETRSi',
    year: 1989,
    hasModel: false,
    style: {
      ambientIntensity: 0.4,
      ambientColor: '#EEF4FF',
      keyIntensity: 1.8,
      keyColor: '#F0F8FF',
      keyPosition: [-4, 5, 3],
      rimIntensity: 0.5,
      rimColor: '#6688CC',
      cameraPosition: [0, 0.3, 3.3],
      cameraTarget: [0, 0, 0],
      fogColor: '#080C14',
      fogNear: 6,
      fogFar: 14,
      autoRotateSpeed: 0.45,
      autoRotateAxis: 'y',
      roughness: 0.5,
      metalness: 0.6,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#98DDCA',
      placeholderTextColor: '#EEF4FF',
      descriptor: '6×4.5 medium format. System camera.',
      // Real Bronica ETRSi = black plastic + brushed chrome (modern)
      environmentPreset: 'studio',
      environmentIntensity: 0.68,
      bodyColor: '#121212', // Modern black
      bodyMetalness: 0.0,
      bodyRoughness: 0.95,
      chromeColor: '#C2C2C2', // Brushed chrome
      chromeMetalness: 0.88,
      chromeRoughness: 0.32,
      lensBarrelColor: '#0A0A0A',
      lensBarrelMetalness: 0.76,
      lensBarrelRoughness: 0.19,
    },
  },
  {
    name: 'Fuji GW690',
    year: 1979,
    hasModel: false,
    style: {
      ambientIntensity: 0.4,
      ambientColor: '#FFF0F0',
      keyIntensity: 1.9,
      keyColor: '#FFE8D8',
      keyPosition: [3, 5, 4],
      rimIntensity: 0.4,
      rimColor: '#CC4444',
      cameraPosition: [0, 0, 3.2],
      cameraTarget: [0, 0, 0],
      fogColor: '#100808',
      fogNear: 6,
      fogFar: 14,
      autoRotateSpeed: 0.5,
      autoRotateAxis: 'y',
      roughness: 0.7,
      metalness: 0.35,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#D4A5A5',
      placeholderTextColor: '#FFF0F0',
      descriptor: 'Texas Leica. Massive 6×9 negative.',
      // Real Fuji GW690 = leather wrapped + brass fittings
      environmentPreset: 'studio',
      environmentIntensity: 0.63,
      bodyColor: '#1A1612', // Warm tan leather
      bodyMetalness: 0.0,
      bodyRoughness: 0.88,
      chromeColor: '#A8A070', // Brass tone
      chromeMetalness: 0.65,
      chromeRoughness: 0.45,
      lensBarrelColor: '#0F0D0A',
      lensBarrelMetalness: 0.55,
      lensBarrelRoughness: 0.35,
    },
  },
  {
    name: 'Linhof Technika',
    year: 1946,
    hasModel: false,
    style: {
      ambientIntensity: 0.3,
      ambientColor: '#F8F4EC',
      keyIntensity: 2.2,
      keyColor: '#FFF8F0',
      keyPosition: [1, 8, 3],
      rimIntensity: 0.3,
      rimColor: '#AA8855',
      cameraPosition: [0, 0.5, 3.0],
      cameraTarget: [0, 0, 0],
      fogColor: '#0C0A06',
      fogNear: 5,
      fogFar: 12,
      autoRotateSpeed: 0.2,
      autoRotateAxis: 'y',
      roughness: 0.5,
      metalness: 0.6,
      color: null,
      emissive: null,
      emissiveIntensity: 0,
      placeholderAccent: '#9B59B6',
      placeholderTextColor: '#F8F4EC',
      descriptor: 'Large format. Precision since 1946.',
      // Real Linhof Technika = wood + dull polished brass + aged
      environmentPreset: 'studio',
      environmentIntensity: 0.58,
      bodyColor: '#3A3430', // Dark wood
      bodyMetalness: 0.1,
      bodyRoughness: 0.82,
      chromeColor: '#9A8A70', // Aged brass
      chromeMetalness: 0.55,
      chromeRoughness: 0.5,
      lensBarrelColor: '#1A1815',
      lensBarrelMetalness: 0.5,
      lensBarrelRoughness: 0.4,
    },
  },
];

/* ── Scene lighting with smooth lerp transitions ─────── */

function SceneLights({ style: _style }: { style: CameraStyle }) {
  void _style; // Prop retained for API compatibility; three-point rig uses fixed values
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);

  // Lerp target colors (fixed)
  const tKeyColor = useMemo(() => new THREE.Color('#FFF8F0'), []);
  const tFillColor = useMemo(() => new THREE.Color('#EEF4FF'), []);
  const tRimColor = useMemo(() => new THREE.Color('#CCDDFF'), []);

  useFrame(() => {
    const α = 0.06; // ~0.8s lerp at 60fps

    // Key light
    if (keyRef.current) {
      keyRef.current.color.lerp(tKeyColor, α);
      keyRef.current.intensity = THREE.MathUtils.lerp(
        keyRef.current.intensity,
        1.4,
        α
      );
    }

    // Fill light
    if (fillRef.current) {
      fillRef.current.color.lerp(tFillColor, α);
      fillRef.current.intensity = THREE.MathUtils.lerp(
        fillRef.current.intensity,
        0.4,
        α
      );
    }

    // Rim light
    if (rimRef.current) {
      rimRef.current.color.lerp(tRimColor, α);
      rimRef.current.intensity = THREE.MathUtils.lerp(
        rimRef.current.intensity,
        0.5,
        α
      );
    }

    // Ambient
    if (ambRef.current) {
      ambRef.current.intensity = THREE.MathUtils.lerp(
        ambRef.current.intensity,
        0.15,
        α
      );
    }
  });

  return (
    <>
      {/* Key Light — Primary, dramatic form definition */}
      <directionalLight
        ref={keyRef}
        color="#FFF8F0"
        intensity={1.4}
        position={[-3, 5, 3]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />

      {/* Fill Light — Secondary, lifts shadows, softens harshness */}
      <directionalLight
        ref={fillRef}
        color="#EEF4FF"
        intensity={0.4}
        position={[4, 2, 2]}
        castShadow={false}
      />

      {/* Rim Light — Backlight, separates model from background */}
      <directionalLight
        ref={rimRef}
        color="#CCDDFF"
        intensity={0.5}
        position={[0, 3, -5]}
        castShadow={false}
      />

      {/* Ambient Light — Prevents pure black in deep shadows */}
      <ambientLight
        ref={ambRef}
        color="#FFFFFF"
        intensity={0.15}
      />
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

  /* ── Materials assigned DIRECTLY to JSX meshes ── */

  const bodyMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: style.bodyColor ?? '#1A1A18',
        metalness: style.bodyMetalness ?? 0.0,
        roughness: style.bodyRoughness ?? 0.85,
        envMapIntensity: 0.6,
      }),
    [style.bodyColor, style.bodyMetalness, style.bodyRoughness]
  );

  const chromeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: style.chromeColor ?? '#C8C8C8',
        metalness: style.chromeMetalness ?? 0.95,
        roughness: style.chromeRoughness ?? 0.25,
        envMapIntensity: 0.8,
      }),
    [style.chromeColor, style.chromeMetalness, style.chromeRoughness]
  );

  const lensMat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#FFFFFF',
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.95,
        ior: 1.52,
        thickness: 0.5,
      }),
    []
  );

  const lensBarrelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: style.lensBarrelColor ?? '#111111',
        metalness: style.lensBarrelMetalness ?? 0.8,
        roughness: style.lensBarrelRoughness ?? 0.15,
        envMapIntensity: 0.7,
      }),
    [style.lensBarrelColor, style.lensBarrelMetalness, style.lensBarrelRoughness]
  );

  // Auto-rotate
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * style.autoRotateSpeed;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.35) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* Body — leatherette/paint (matte black) */}
      <mesh material={bodyMat} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1, 0.8]} />
      </mesh>

      {/* Top plate — chrome */}
      <mesh material={chromeMat} position={[0, 0.56, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.84, 0.12, 0.82]} />
      </mesh>

      {/* Bottom plate — chrome */}
      <mesh material={chromeMat} position={[0, -0.56, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.84, 0.12, 0.82]} />
      </mesh>

      {/* Pentaprism hump — body material */}
      <mesh material={bodyMat} position={[-0.1, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.3, 0.7]} />
      </mesh>

      {/* Lens barrel — dark metal */}
      <mesh material={lensBarrelMat} position={[0, -0.02, 0.65]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.34, 0.5, 48]} />
      </mesh>

      {/* Lens glass element — transmissive optical glass */}
      <mesh material={lensMat} position={[0, -0.02, 0.95]}>
        <sphereGeometry args={[0.24, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      {/* Film advance lever — chrome accent */}
      <mesh material={chromeMat} position={[0.78, 0.63, 0]} castShadow>
        <boxGeometry args={[0.14, 0.07, 0.16]} />
      </mesh>

      {/* Shutter speed dial — chrome accent */}
      <mesh material={chromeMat} position={[0.5, 0.68, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.08, 24]} />
      </mesh>

      {/* Focus ring on lens barrel */}
      <mesh material={chromeMat} position={[0, -0.02, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.025, 8, 32]} />
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
              <SceneFog style={active.style} />
              <CameraRig style={active.style} />
              <SceneLights style={active.style} />

              {/* ── Post-Processing ── */}
              <EffectComposer>
                <Bloom
                  luminanceThreshold={0.85}
                  intensity={0.15}
                  radius={0.6}
                />
              </EffectComposer>

              <Suspense fallback={null}>
                <CameraSculpture style={active.style} />
              </Suspense>

              {/* ── Environment + Grounding ── */}
              <Environment
                preset={active.style.environmentPreset ?? 'studio'}
                background={false}
              />
              <ContactShadows
                opacity={0.6}
                scale={2}
                blur={2.5}
                far={0.8}
              />

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
