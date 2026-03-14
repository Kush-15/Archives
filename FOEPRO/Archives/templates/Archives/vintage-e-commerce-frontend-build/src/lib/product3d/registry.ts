/**
 * Product 3D Registry
 * 
 * Slug-driven Three.js product renderer registry following skill guidelines:
 * - threejs-fundamentals: Renderer lifecycle, camera setup, resize handling, DPR caps
 * - threejs-geometry: Procedural primitives, BufferGeometry rules, instancing eligibility
 * - threejs-materials: PBR defaults, material reuse policy
 * - threejs-lighting: Low-cost light rigs, shadow constraints
 * - threejs-loaders: Async loading, GLB/Draco/KTX2 handling
 * - threejs-textures: Color-space correctness, compression path
 * - threejs-animation: Delta-time updates, gated motion
 * - threejs-postprocessing: Effect gating, low-tier disablement
 * - threejs-shaders: Custom shader constraints, uniform management
 * 
 * Priority: Performance-first for low-RAM/integrated-GPU hardware
 * Baseline: 8GB RAM laptop with integrated graphics
 */

import type {
  ProductRendererConfig,
  ProductCategory,
  QualityTier,
  RegistryLookupResult,
} from './types';
import { getPerformanceBudget } from './constants';
import { detectQualityTier } from './tierDetection';

// =============================================================================
// GEOMETRY PROFILES (following threejs-geometry skill)
// =============================================================================

/**
 * Base geometry profiles for product families.
 * Procedural-first design with tier-specific segment counts.
 */
export const GEOMETRY_PROFILES = {
  // Audio products: rectangular bodies with control elements
  audioPortable: {
    baseShape: 'box' as const,
    dimensions: [1.6, 1.0, 0.4],
    segments: {
      low: [1, 1, 1],
      medium: [2, 2, 1],
      high: [4, 4, 2],
    },
  },
  audioReceiver: {
    baseShape: 'box' as const,
    dimensions: [2.0, 0.8, 1.2],
    segments: {
      low: [1, 1, 1],
      medium: [2, 2, 2],
      high: [4, 4, 4],
    },
  },
  turntable: {
    baseShape: 'box' as const,
    dimensions: [2.0, 0.3, 2.0],
    segments: {
      low: [1, 1, 1],
      medium: [2, 1, 2],
      high: [4, 2, 4],
    },
  },

  // Photography: cylindrical lenses, boxy bodies
  cameraRangefinder: {
    baseShape: 'box' as const,
    dimensions: [1.4, 0.8, 0.6],
    segments: {
      low: [1, 1, 1],
      medium: [2, 2, 2],
      high: [4, 4, 4],
    },
  },
  cameraMediumFormat: {
    baseShape: 'box' as const,
    dimensions: [1.0, 1.0, 1.0],
    segments: {
      low: [1, 1, 1],
      medium: [2, 2, 2],
      high: [4, 4, 4],
    },
  },
  cameraFolding: {
    baseShape: 'box' as const,
    dimensions: [1.2, 1.0, 0.3],
    segments: {
      low: [1, 1, 1],
      medium: [2, 2, 1],
      high: [4, 4, 2],
    },
  },

  // Computing: monitors, keyboards, boxes
  computer: {
    baseShape: 'box' as const,
    dimensions: [1.2, 1.4, 1.0],
    segments: {
      low: [1, 1, 1],
      medium: [2, 2, 2],
      high: [4, 4, 4],
    },
  },
  keyboard: {
    baseShape: 'box' as const,
    dimensions: [2.2, 0.2, 0.8],
    segments: {
      low: [1, 1, 1],
      medium: [2, 1, 2],
      high: [4, 2, 4],
    },
  },

  // Gaming: consoles
  console: {
    baseShape: 'box' as const,
    dimensions: [1.6, 0.4, 1.2],
    segments: {
      low: [1, 1, 1],
      medium: [2, 1, 2],
      high: [4, 2, 4],
    },
  },

  // Television: CRT shape
  television: {
    baseShape: 'box' as const,
    dimensions: [1.4, 1.2, 1.2],
    segments: {
      low: [1, 1, 1],
      medium: [2, 2, 2],
      high: [4, 4, 4],
    },
  },

  // Fallback silhouette
  fallback: {
    baseShape: 'box' as const,
    dimensions: [1.0, 1.0, 1.0],
    segments: {
      low: [1, 1, 1],
      medium: [1, 1, 1],
      high: [2, 2, 2],
    },
  },
} as const;

// =============================================================================
// MATERIAL PROFILES (following threejs-materials skill)
// =============================================================================

/**
 * Material presets following PBR standards.
 * Realistic values based on actual vintage electronics materials.
 * Pooled/reused to avoid memory churn.
 */
export const MATERIAL_PROFILES = {
  // Metals ──────────────────────────────────────────────────────────────────
  brushedAluminum: {
    type: 'standard' as const,
    color: '#b0b0b0',
    metalness: 0.95,
    roughness: 0.35,
    envMapIntensity: 0.7,
  },
  chrome: {
    type: 'physical' as const,
    color: '#e0e0e0',
    metalness: 1.0,
    roughness: 0.05,
    envMapIntensity: 0.8,
  },
  polishedChrome: {
    type: 'physical' as const,
    color: '#f0f0f0',
    metalness: 1.0,
    roughness: 0.02,
    envMapIntensity: 1.0,
  },
  darkMetal: {
    type: 'standard' as const,
    color: '#1a1a20',
    metalness: 0.7,
    roughness: 0.45,
    envMapIntensity: 0.8,
  },
  brass: {
    type: 'standard' as const,
    color: '#c5a55a',
    metalness: 0.9,
    roughness: 0.3,
    envMapIntensity: 1.2,
  },
  anodizedAluminum: {
    type: 'standard' as const,
    color: '#8a8a8a',
    metalness: 0.85,
    roughness: 0.25,
    envMapIntensity: 1.0,
  },

  // Plastics ────────────────────────────────────────────────────────────────
  mattePlastic: {
    type: 'standard' as const,
    color: '#222222',
    metalness: 0.0,
    roughness: 0.75,
    envMapIntensity: 0.4,
  },
  glossyPlastic: {
    type: 'standard' as const,
    color: '#111111',
    metalness: 0.0,
    roughness: 0.15,
    envMapIntensity: 0.7,
  },
  beigeComputer: {
    type: 'standard' as const,
    color: '#d4c4a8',
    metalness: 0.0,
    roughness: 0.55,
    envMapIntensity: 0.4,
  },
  grayPlastic: {
    type: 'standard' as const,
    color: '#6b7280',
    metalness: 0.0,
    roughness: 0.55,
    envMapIntensity: 0.4,
  },
  absPlastic: {
    type: 'standard' as const,
    color: '#2a2a2a',
    metalness: 0.0,
    roughness: 0.6,
    envMapIntensity: 0.5,
  },

  // Leather/Vinyl ──────────────────────────────────────────────────────────
  leather: {
    type: 'standard' as const,
    color: '#5c4a32',
    metalness: 0.0,
    roughness: 0.85,
    envMapIntensity: 0.25,
  },
  leatherette: {
    type: 'standard' as const,
    color: '#1a1a1a',
    metalness: 0.0,
    roughness: 0.9,
    envMapIntensity: 0.15,
  },

  // Wood ───────────────────────────────────────────────────────────────────
  woodgrain: {
    type: 'standard' as const,
    color: '#6d3a1a',
    metalness: 0.0,
    roughness: 0.65,
    envMapIntensity: 0.3,
  },

  // Glass/Screens ──────────────────────────────────────────────────────────
  screen: {
    type: 'standard' as const,
    color: '#050508',
    metalness: 0.0,
    roughness: 0.08,
    envMapIntensity: 1.0,
  },
  screenGlow: {
    type: 'standard' as const,
    color: '#0a0a14',
    metalness: 0.0,
    roughness: 0.08,
    emissive: '#2a5088',
    emissiveIntensity: 0.5,
    envMapIntensity: 0.6,
  },
  lens: {
    type: 'physical' as const,
    color: '#06060e',
    metalness: 0.0,
    roughness: 0.02,
    envMapIntensity: 0.8,
    transparent: true,
    opacity: 0.85,
  },

  // Rubber ─────────────────────────────────────────────────────────────────
  rubber: {
    type: 'standard' as const,
    color: '#1a1a1a',
    metalness: 0.0,
    roughness: 0.95,
    envMapIntensity: 0.1,
  },

  // Fallback ───────────────────────────────────────────────────────────────
  fallback: {
    type: 'lambert' as const,
    color: '#404040',
    metalness: 0.0,
    roughness: 1.0,
  },
} as const;

// =============================================================================
// LIGHTING PROFILES (following threejs-lighting skill)
// =============================================================================

/**
 * Lighting rigs optimized for cost by tier.
 * Low tier: ambient + single directional (no shadows)
 * Medium tier: three-point setup with soft shadows
 * High tier: full setup with environment lighting + rim
 */
export const LIGHTING_PROFILES = {
  studioSoft: {
    ambientIntensity: 0.35,
    ambientColor: '#f8f4f0',
    keyLight: {
      intensity: 0.9,
      color: '#fff8f0',
      position: [5, 5, 5] as [number, number, number],
      castShadow: true,
    },
    fillLight: {
      intensity: 0.35,
      color: '#d0d8ff',
      position: [-5, 3, 3] as [number, number, number],
    },
    rimLight: {
      intensity: 0.3,
      color: '#ffffff',
      position: [0, 3, -5] as [number, number, number],
    },
    useEnvironment: true,
    environment: 'studio',
  },
  studioMinimal: {
    ambientIntensity: 0.6,
    ambientColor: '#f0f0f0',
    keyLight: {
      intensity: 0.8,
      color: '#ffffff',
      position: [3, 4, 4] as [number, number, number],
      castShadow: false,
    },
    useEnvironment: false,
  },
  dramatic: {
    ambientIntensity: 0.15,
    ambientColor: '#0a0a18',
    keyLight: {
      intensity: 1.0,
      color: '#fff0e0',
      position: [4, 6, 3] as [number, number, number],
      castShadow: true,
    },
    fillLight: {
      intensity: 0.2,
      color: '#4060a0',
      position: [-4, 2, 2] as [number, number, number],
    },
    rimLight: {
      intensity: 0.4,
      color: '#ff8040',
      position: [-2, 4, -4] as [number, number, number],
    },
    useEnvironment: true,
    environment: 'sunset',
  },
  fallback: {
    ambientIntensity: 0.7,
    ambientColor: '#ffffff',
    keyLight: {
      intensity: 0.5,
      color: '#ffffff',
      position: [2, 3, 3] as [number, number, number],
      castShadow: false,
    },
    useEnvironment: false,
  },
} as const;

// =============================================================================
// ANIMATION PROFILES (following threejs-animation skill)
// =============================================================================

/**
 * Animation configurations with delta-time based updates.
 * Gated by reduced-motion preference and tier.
 */
export const ANIMATION_PROFILES = {
  idleSpin: {
    idleRotation: {
      enabled: true,
      speed: 0.3,
      axis: 'y' as const,
    },
    hoverEffect: {
      enabled: true,
      scale: 1.02,
      lift: 0.05,
      duration: 300,
    },
    entryAnimation: {
      enabled: true,
      type: 'scale' as const,
      duration: 600,
      delay: 100,
    },
  },
  slowFloat: {
    idleRotation: {
      enabled: true,
      speed: 0.15,
      axis: 'y' as const,
    },
    hoverEffect: {
      enabled: true,
      scale: 1.01,
      lift: 0.03,
      duration: 400,
    },
    entryAnimation: {
      enabled: true,
      type: 'fade' as const,
      duration: 800,
      delay: 0,
    },
  },
  static: {
    idleRotation: {
      enabled: false,
      speed: 0,
      axis: 'y' as const,
    },
    hoverEffect: {
      enabled: false,
    },
    entryAnimation: {
      enabled: false,
    },
  },
  minimalLowTier: {
    idleRotation: {
      enabled: true,
      speed: 0.2,
      axis: 'y' as const,
    },
    hoverEffect: {
      enabled: false,
    },
    entryAnimation: {
      enabled: false,
    },
  },
} as const;

// =============================================================================
// CAMERA PROFILES (following threejs-fundamentals skill)
// =============================================================================

/**
 * Camera configurations for product viewing.
 */
export const CAMERA_PROFILES = {
  standard: {
    position: [0, 0, 4] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 45,
    near: 0.1,
    far: 100,
    controls: {
      enabled: true,
      enableZoom: false,
      enablePan: false,
      minDistance: 2,
      maxDistance: 8,
      minPolarAngle: Math.PI / 6,
      maxPolarAngle: Math.PI / 1.5,
      autoRotate: true,
      autoRotateSpeed: 1.0,
      dampingFactor: 0.05,
    },
  },
  closeup: {
    position: [0, 0, 3] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 35,
    near: 0.1,
    far: 50,
    controls: {
      enabled: true,
      enableZoom: true,
      enablePan: false,
      minDistance: 1.5,
      maxDistance: 5,
      minPolarAngle: Math.PI / 4,
      maxPolarAngle: Math.PI / 1.8,
      autoRotate: false,
      autoRotateSpeed: 0,
      dampingFactor: 0.08,
    },
  },
  hero: {
    position: [2, 1.5, 3] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    fov: 40,
    near: 0.1,
    far: 100,
    controls: {
      enabled: true,
      enableZoom: false,
      enablePan: false,
      minDistance: 3,
      maxDistance: 6,
      minPolarAngle: Math.PI / 6,
      maxPolarAngle: Math.PI / 2,
      autoRotate: true,
      autoRotateSpeed: 0.5,
      dampingFactor: 0.05,
    },
  },
} as const;

// =============================================================================
// PRODUCT REGISTRY
// =============================================================================

/**
 * Complete product renderer registry.
 * Each entry is keyed by product slug only (confirmed decision).
 */
const productRegistry: Map<string, ProductRendererConfig> = new Map();

// -----------------------------------------------------------------------------
// AUDIO PRODUCTS
// -----------------------------------------------------------------------------

productRegistry.set('sony-walkman-tps-l2', {
  slug: 'sony-walkman-tps-l2',
  category: 'audio',
  displayName: 'Sony Walkman TPS-L2',
  procedural: true,
  proceduralConfig: {
    ...GEOMETRY_PROFILES.audioPortable,
    features: [
      { type: 'button', position: [0.5, 0.35, 0.21], scale: [0.1, 0.06, 0.02] },
      { type: 'button', position: [0.3, 0.35, 0.21], scale: [0.1, 0.06, 0.02] },
      { type: 'dial', position: [-0.5, 0.3, 0.21], scale: [0.12, 0.12, 0.03] },
      { type: 'slot', position: [0, 0, 0.21], scale: [0.8, 0.5, 0.02] }, // cassette door
      { type: 'port', position: [0.6, -0.3, 0.21], scale: [0.06, 0.06, 0.02] }, // headphone jack
    ],
  },
  material: {
    ...MATERIAL_PROFILES.darkMetal,
    color: '#14305a', // Sony blue — deep metallic
    metalness: 0.65,
    roughness: 0.5,
  },
  secondaryMaterials: {
    buttons: MATERIAL_PROFILES.chrome,
    dials: MATERIAL_PROFILES.chrome,
    cassetteDoor: { ...MATERIAL_PROFILES.mattePlastic, color: '#1a1a1a' },
    slot: { ...MATERIAL_PROFILES.absPlastic, color: '#0d0d0d' },
    port: MATERIAL_PROFILES.chrome,
  },
  lighting: LIGHTING_PROFILES.studioSoft,
  camera: CAMERA_PROFILES.standard,
  animation: ANIMATION_PROFILES.idleSpin,
  complexity: 'moderate',
  estimatedTriangles: 2000,
  lowTierOverrides: {
    material: MATERIAL_PROFILES.mattePlastic,
    lighting: LIGHTING_PROFILES.studioMinimal,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

productRegistry.set('braun-t1000', {
  slug: 'braun-t1000',
  category: 'audio',
  displayName: 'Braun T1000 World Receiver',
  procedural: true,
  proceduralConfig: {
    ...GEOMETRY_PROFILES.audioReceiver,
    features: [
      { type: 'dial', position: [0.6, 0.2, 0.61], scale: [0.15, 0.15, 0.05] },
      { type: 'dial', position: [0.3, 0.2, 0.61], scale: [0.15, 0.15, 0.05] },
      { type: 'dial', position: [0, 0.2, 0.61], scale: [0.15, 0.15, 0.05] },
      { type: 'speaker', position: [-0.6, 0, 0.61], scale: [0.4, 0.5, 0.02] },
      { type: 'screen', position: [0.3, -0.1, 0.61], scale: [0.6, 0.2, 0.01] }, // frequency display
    ],
  },
  material: {
    ...MATERIAL_PROFILES.brushedAluminum,
    color: '#3a3a42', // Braun dark anodized aluminum
    metalness: 0.9,
    roughness: 0.3,
  },
  secondaryMaterials: {
    dials: MATERIAL_PROFILES.polishedChrome,
    dial: MATERIAL_PROFILES.polishedChrome,
    speaker: { ...MATERIAL_PROFILES.mattePlastic, color: '#141414' },
    display: MATERIAL_PROFILES.screenGlow,
    screen: MATERIAL_PROFILES.screenGlow,
  },
  lighting: LIGHTING_PROFILES.studioSoft,
  camera: CAMERA_PROFILES.standard,
  animation: ANIMATION_PROFILES.slowFloat,
  complexity: 'moderate',
  estimatedTriangles: 3000,
  lowTierOverrides: {
    material: MATERIAL_PROFILES.grayPlastic,
    lighting: LIGHTING_PROFILES.studioMinimal,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

productRegistry.set('technics-sl1200', {
  slug: 'technics-sl1200',
  category: 'audio',
  displayName: 'Technics SL-1200 MK2',
  procedural: true,
  proceduralConfig: {
    ...GEOMETRY_PROFILES.turntable,
    features: [
      { type: 'dial', position: [0.7, 0.16, 0.7], scale: [0.1, 0.05, 0.1] }, // pitch slider
      { type: 'button', position: [0.7, 0.16, 0.4], scale: [0.06, 0.04, 0.06] }, // start/stop
      { type: 'custom', position: [0, 0.16, 0], scale: [0.6, 0.02, 0.6], rotation: [0, 0, 0] }, // platter
      { type: 'custom', position: [-0.5, 0.2, 0.5], scale: [0.4, 0.15, 0.1], rotation: [0, -0.3, 0] }, // tonearm
    ],
  },
  material: {
    ...MATERIAL_PROFILES.darkMetal,
    color: '#0a0a10', // Technics deep black
    metalness: 0.6,
    roughness: 0.5,
  },
  secondaryMaterials: {
    platter: MATERIAL_PROFILES.brushedAluminum,
    controls: MATERIAL_PROFILES.chrome,
    custom: MATERIAL_PROFILES.brushedAluminum,
    button: MATERIAL_PROFILES.chrome,
    dial: MATERIAL_PROFILES.chrome,
  },
  lighting: LIGHTING_PROFILES.dramatic,
  camera: CAMERA_PROFILES.hero,
  animation: ANIMATION_PROFILES.slowFloat,
  complexity: 'complex',
  estimatedTriangles: 4000,
  lowTierOverrides: {
    material: MATERIAL_PROFILES.mattePlastic,
    lighting: LIGHTING_PROFILES.fallback,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

// -----------------------------------------------------------------------------
// PHOTOGRAPHY PRODUCTS
// -----------------------------------------------------------------------------

productRegistry.set('polaroid-sx-70', {
  slug: 'polaroid-sx-70',
  category: 'photography',
  displayName: 'Polaroid SX-70',
  procedural: true,
  proceduralConfig: {
    ...GEOMETRY_PROFILES.cameraFolding,
    features: [
      { type: 'lens', position: [0, 0.1, 0.16], scale: [0.2, 0.2, 0.1] },
      { type: 'button', position: [0.4, 0.3, 0.16], scale: [0.08, 0.08, 0.02] }, // shutter
      { type: 'screen', position: [0, 0.35, 0.16], scale: [0.15, 0.08, 0.01] }, // viewfinder
    ],
  },
  material: {
    ...MATERIAL_PROFILES.leather,
    color: '#6d4c2e', // Tan leather SX-70
    roughness: 0.85,
  },
  secondaryMaterials: {
    chrome: MATERIAL_PROFILES.polishedChrome,
    button: MATERIAL_PROFILES.chrome,
    lens: MATERIAL_PROFILES.lens,
    screen: MATERIAL_PROFILES.screen,
  },
  lighting: LIGHTING_PROFILES.studioSoft,
  camera: CAMERA_PROFILES.closeup,
  animation: ANIMATION_PROFILES.idleSpin,
  complexity: 'moderate',
  estimatedTriangles: 2500,
  lowTierOverrides: {
    material: { ...MATERIAL_PROFILES.mattePlastic, color: '#8b7355' },
    lighting: LIGHTING_PROFILES.studioMinimal,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

productRegistry.set('hasselblad-500c', {
  slug: 'hasselblad-500c',
  category: 'photography',
  displayName: 'Hasselblad 500C',
  procedural: true,
  proceduralConfig: {
    ...GEOMETRY_PROFILES.cameraMediumFormat,
    features: [
      { type: 'lens', position: [0, 0, 0.55], scale: [0.35, 0.35, 0.3] },
      { type: 'custom', position: [0, 0.55, 0], scale: [0.8, 0.1, 0.8] }, // viewfinder hood
      { type: 'dial', position: [0.45, 0, 0.3], scale: [0.08, 0.3, 0.08] }, // film crank
      { type: 'custom', position: [0, 0, -0.55], scale: [0.85, 0.85, 0.1] }, // film back
    ],
  },
  material: {
    ...MATERIAL_PROFILES.chrome,
    color: '#d0d0d0', // Classic chrome body
  },
  secondaryMaterials: {
    body: MATERIAL_PROFILES.darkMetal,
    custom: MATERIAL_PROFILES.darkMetal,
    lens: MATERIAL_PROFILES.lens,
    dial: MATERIAL_PROFILES.polishedChrome,
    leatherGrip: MATERIAL_PROFILES.leatherette,
  },
  lighting: LIGHTING_PROFILES.studioSoft,
  camera: CAMERA_PROFILES.standard,
  animation: ANIMATION_PROFILES.slowFloat,
  complexity: 'complex',
  estimatedTriangles: 5000,
  lowTierOverrides: {
    material: MATERIAL_PROFILES.grayPlastic,
    lighting: LIGHTING_PROFILES.studioMinimal,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

productRegistry.set('leica-m3', {
  slug: 'leica-m3',
  category: 'photography',
  displayName: 'Leica M3',
  procedural: true,
  proceduralConfig: {
    ...GEOMETRY_PROFILES.cameraRangefinder,
    features: [
      { type: 'lens', position: [0, 0, 0.35], scale: [0.2, 0.2, 0.15] },
      { type: 'screen', position: [0.35, 0.2, 0.31], scale: [0.2, 0.1, 0.01] }, // rangefinder window
      { type: 'dial', position: [0.5, 0.41, 0], scale: [0.15, 0.05, 0.15] }, // shutter speed dial
      { type: 'dial', position: [-0.4, 0.41, 0], scale: [0.1, 0.03, 0.1] }, // film rewind
      { type: 'button', position: [0.55, 0.2, 0.2], scale: [0.05, 0.05, 0.03] }, // shutter release
    ],
  },
  material: {
    ...MATERIAL_PROFILES.chrome,
    color: '#dcdce0', // Leica silver chrome
  },
  secondaryMaterials: {
    topPlate: MATERIAL_PROFILES.polishedChrome,
    body: MATERIAL_PROFILES.darkMetal,
    leatherette: MATERIAL_PROFILES.leatherette,
    lens: MATERIAL_PROFILES.lens,
    dial: MATERIAL_PROFILES.polishedChrome,
    button: MATERIAL_PROFILES.chrome,
    screen: MATERIAL_PROFILES.screen,
  },
  lighting: LIGHTING_PROFILES.studioSoft,
  camera: CAMERA_PROFILES.closeup,
  animation: ANIMATION_PROFILES.idleSpin,
  complexity: 'complex',
  estimatedTriangles: 4500,
  lowTierOverrides: {
    material: MATERIAL_PROFILES.grayPlastic,
    lighting: LIGHTING_PROFILES.studioMinimal,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

// -----------------------------------------------------------------------------
// COMPUTING PRODUCTS
// -----------------------------------------------------------------------------

productRegistry.set('apple-macintosh-128k', {
  slug: 'apple-macintosh-128k',
  category: 'computing',
  displayName: 'Apple Macintosh 128K',
  procedural: true,
  proceduralConfig: {
    ...GEOMETRY_PROFILES.computer,
    features: [
      { type: 'screen', position: [0, 0.25, 0.51], scale: [0.55, 0.45, 0.01] },
      { type: 'slot', position: [0, -0.35, 0.51], scale: [0.4, 0.02, 0.01] }, // floppy slot
      { type: 'custom', position: [0, -0.5, 0.3], scale: [0.2, 0.05, 0.2] }, // vent
    ],
  },
  material: {
    ...MATERIAL_PROFILES.beigeComputer,
    color: '#c8b690', // Apple Platinum beige
    roughness: 0.5,
    envMapIntensity: 0.5,
  },
  secondaryMaterials: {
    screen: MATERIAL_PROFILES.screenGlow,
    vents: { ...MATERIAL_PROFILES.mattePlastic, color: '#b0a080' },
    slot: { ...MATERIAL_PROFILES.darkMetal, color: '#2a2a2a' },
    custom: { ...MATERIAL_PROFILES.mattePlastic, color: '#b0a080' },
  },
  lighting: LIGHTING_PROFILES.studioSoft,
  camera: CAMERA_PROFILES.standard,
  animation: ANIMATION_PROFILES.slowFloat,
  complexity: 'moderate',
  estimatedTriangles: 2000,
  lowTierOverrides: {
    material: MATERIAL_PROFILES.beigeComputer,
    secondaryMaterials: { screen: MATERIAL_PROFILES.screen },
    lighting: LIGHTING_PROFILES.studioMinimal,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

productRegistry.set('ibm-model-m', {
  slug: 'ibm-model-m',
  category: 'computing',
  displayName: 'IBM Model M Keyboard',
  procedural: true,
  proceduralConfig: {
    ...GEOMETRY_PROFILES.keyboard,
    features: [
      // Key rows represented as features for higher tiers
      { type: 'custom', position: [0, 0.11, 0], scale: [2.0, 0.02, 0.6] }, // key surface
    ],
  },
  material: {
    ...MATERIAL_PROFILES.beigeComputer,
    color: '#ccc4b0', // IBM warm ivory
    roughness: 0.5,
    envMapIntensity: 0.5,
  },
  secondaryMaterials: {
    keys: { ...MATERIAL_PROFILES.mattePlastic, color: '#e0d8c8' },
    custom: { ...MATERIAL_PROFILES.mattePlastic, color: '#e0d8c8' },
  },
  lighting: LIGHTING_PROFILES.studioSoft,
  camera: { ...CAMERA_PROFILES.hero, position: [1.5, 1, 2] },
  animation: ANIMATION_PROFILES.slowFloat,
  complexity: 'simple',
  estimatedTriangles: 1000,
  lowTierOverrides: {
    lighting: LIGHTING_PROFILES.studioMinimal,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

productRegistry.set('commodore-64', {
  slug: 'commodore-64',
  category: 'computing',
  displayName: 'Commodore 64',
  procedural: true,
  proceduralConfig: {
    baseShape: 'box' as const,
    dimensions: [2.0, 0.25, 0.9],
    segments: {
      low: [1, 1, 1],
      medium: [2, 1, 2],
      high: [4, 2, 4],
    },
    features: [
      { type: 'custom', position: [0, 0.13, 0.1], scale: [1.8, 0.02, 0.5] }, // keyboard area
      { type: 'custom', position: [-0.8, 0.13, -0.3], scale: [0.15, 0.01, 0.08] }, // function keys
    ],
  },
  material: {
    ...MATERIAL_PROFILES.beigeComputer,
    color: '#8e8878', // C64 brownish grey
    roughness: 0.55,
    envMapIntensity: 0.45,
  },
  secondaryMaterials: {
    keys: { ...MATERIAL_PROFILES.mattePlastic, color: '#3a3630' },
    custom: { ...MATERIAL_PROFILES.mattePlastic, color: '#3a3630' },
    badge: MATERIAL_PROFILES.chrome,
  },
  lighting: LIGHTING_PROFILES.studioSoft,
  camera: CAMERA_PROFILES.hero,
  animation: ANIMATION_PROFILES.slowFloat,
  complexity: 'simple',
  estimatedTriangles: 1200,
  lowTierOverrides: {
    lighting: LIGHTING_PROFILES.studioMinimal,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

// -----------------------------------------------------------------------------
// GAMING PRODUCTS
// -----------------------------------------------------------------------------

productRegistry.set('nintendo-nes', {
  slug: 'nintendo-nes',
  category: 'gaming',
  displayName: 'Nintendo Entertainment System',
  procedural: true,
  proceduralConfig: {
    ...GEOMETRY_PROFILES.console,
    features: [
      { type: 'slot', position: [0, 0.21, 0.2], scale: [0.8, 0.05, 0.4] }, // cartridge slot
      { type: 'button', position: [-0.5, 0.21, -0.4], scale: [0.08, 0.03, 0.08] }, // power
      { type: 'button', position: [-0.3, 0.21, -0.4], scale: [0.08, 0.03, 0.08] }, // reset
      { type: 'custom', position: [0, 0.21, -0.45], scale: [1.4, 0.03, 0.15] }, // front lip
    ],
  },
  material: {
    ...MATERIAL_PROFILES.grayPlastic,
    color: '#b8b4aa', // NES warm grey
    roughness: 0.5,
    envMapIntensity: 0.45,
  },
  secondaryMaterials: {
    accents: { ...MATERIAL_PROFILES.mattePlastic, color: '#1a1a1a' },
    buttons: { ...MATERIAL_PROFILES.mattePlastic, color: '#1f2937' },
    button: { ...MATERIAL_PROFILES.mattePlastic, color: '#1f2937' },
    slot: { ...MATERIAL_PROFILES.darkMetal, color: '#0d0d0d' },
    custom: { ...MATERIAL_PROFILES.mattePlastic, color: '#d0ccc2' },
  },
  lighting: LIGHTING_PROFILES.studioSoft,
  camera: CAMERA_PROFILES.standard,
  animation: ANIMATION_PROFILES.idleSpin,
  complexity: 'moderate',
  estimatedTriangles: 1800,
  lowTierOverrides: {
    lighting: LIGHTING_PROFILES.studioMinimal,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

productRegistry.set('atari-2600', {
  slug: 'atari-2600',
  category: 'gaming',
  displayName: 'Atari 2600',
  procedural: true,
  proceduralConfig: {
    baseShape: 'box' as const,
    dimensions: [1.8, 0.25, 0.9],
    segments: {
      low: [1, 1, 1],
      medium: [2, 1, 2],
      high: [4, 2, 4],
    },
    features: [
      { type: 'slot', position: [0, 0.13, 0.2], scale: [0.5, 0.04, 0.15] }, // cartridge slot
      { type: 'custom', position: [0, 0.13, -0.2], scale: [0.6, 0.03, 0.3] }, // switches panel
      { type: 'custom', position: [0, 0.13, 0.3], scale: [1.6, 0.01, 0.25] }, // woodgrain strip
    ],
  },
  material: {
    ...MATERIAL_PROFILES.mattePlastic,
    color: '#141210', // Atari black body
    roughness: 0.7,
  },
  secondaryMaterials: {
    woodgrain: MATERIAL_PROFILES.woodgrain,
    custom: MATERIAL_PROFILES.woodgrain,
    switches: MATERIAL_PROFILES.chrome,
    slot: { ...MATERIAL_PROFILES.darkMetal, color: '#0a0a0a' },
  },
  lighting: LIGHTING_PROFILES.studioSoft,
  camera: CAMERA_PROFILES.standard,
  animation: ANIMATION_PROFILES.idleSpin,
  complexity: 'simple',
  estimatedTriangles: 1200,
  lowTierOverrides: {
    lighting: LIGHTING_PROFILES.studioMinimal,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

// -----------------------------------------------------------------------------
// TELEVISION PRODUCTS
// -----------------------------------------------------------------------------

productRegistry.set('sony-trinitron-kv1310', {
  slug: 'sony-trinitron-kv1310',
  category: 'television',
  displayName: 'Sony Trinitron KV-1310',
  procedural: true,
  proceduralConfig: {
    ...GEOMETRY_PROFILES.television,
    features: [
      { type: 'screen', position: [0, 0.1, 0.61], scale: [0.85, 0.7, 0.02] },
      { type: 'dial', position: [0.55, -0.3, 0.61], scale: [0.1, 0.1, 0.05] }, // channel
      { type: 'dial', position: [0.55, -0.1, 0.61], scale: [0.1, 0.1, 0.05] }, // volume
      { type: 'speaker', position: [-0.55, -0.2, 0.61], scale: [0.2, 0.4, 0.02] },
    ],
  },
  material: {
    ...MATERIAL_PROFILES.woodgrain,
    color: '#5c2e0e', // Rich walnut woodgrain
    roughness: 0.6,
    envMapIntensity: 0.35,
  },
  secondaryMaterials: {
    screen: MATERIAL_PROFILES.screenGlow,
    bezel: { ...MATERIAL_PROFILES.mattePlastic, color: '#141414' },
    dials: MATERIAL_PROFILES.polishedChrome,
    dial: MATERIAL_PROFILES.polishedChrome,
    speaker: { ...MATERIAL_PROFILES.mattePlastic, color: '#0d0d0d' },
  },
  lighting: LIGHTING_PROFILES.studioSoft,
  camera: CAMERA_PROFILES.standard,
  animation: ANIMATION_PROFILES.slowFloat,
  complexity: 'moderate',
  estimatedTriangles: 2500,
  lowTierOverrides: {
    material: MATERIAL_PROFILES.mattePlastic,
    secondaryMaterials: { screen: MATERIAL_PROFILES.screen },
    lighting: LIGHTING_PROFILES.studioMinimal,
    animation: ANIMATION_PROFILES.minimalLowTier,
  },
});

// =============================================================================
// FALLBACK CONFIGURATION
// =============================================================================

/**
 * Fallback configuration for unknown slugs or failed asset loads.
 * Renders a lightweight procedural silhouette.
 */
const FALLBACK_CONFIG: ProductRendererConfig = {
  slug: 'fallback',
  category: 'audio', // default category
  displayName: 'Unknown Product',
  procedural: true,
  proceduralConfig: GEOMETRY_PROFILES.fallback,
  material: MATERIAL_PROFILES.fallback,
  lighting: LIGHTING_PROFILES.fallback,
  camera: CAMERA_PROFILES.standard,
  animation: ANIMATION_PROFILES.static,
  complexity: 'simple',
  estimatedTriangles: 12,
};

// =============================================================================
// REGISTRY FUNCTIONS
// =============================================================================

/**
 * Look up a product configuration by slug.
 * Returns the config with tier-specific adjustments applied.
 * 
 * @param slug - Product slug to look up
 * @param tier - Quality tier to apply (auto-detected if not provided)
 * @returns Registry lookup result with config, tier, budget, and fallback flag
 */
export function lookupProduct(
  slug: string,
  tier?: QualityTier
): RegistryLookupResult {
  const activeTier = tier ?? detectQualityTier();
  const budget = getPerformanceBudget(activeTier);
  
  let config = productRegistry.get(slug);
  let isFallback = false;
  
  if (!config) {
    // Unknown slug - use fallback
    config = { ...FALLBACK_CONFIG, slug };
    isFallback = true;
    console.warn(`[Product3D Registry] Unknown slug "${slug}", using fallback`);
  }
  
  // Apply tier-specific overrides
  const finalConfig = applyTierOverrides(config, activeTier);
  
  return {
    config: finalConfig,
    tier: activeTier,
    budget,
    isFallback,
  };
}

/**
 * Apply tier-specific overrides to a product configuration.
 */
function applyTierOverrides(
  config: ProductRendererConfig,
  tier: QualityTier
): ProductRendererConfig {
  if (tier === 'low' && config.lowTierOverrides) {
    return {
      ...config,
      ...config.lowTierOverrides,
      // Ensure slug and core identity is preserved
      slug: config.slug,
      category: config.category,
      displayName: config.displayName,
      procedural: config.procedural,
    };
  }
  
  if (tier === 'medium' && config.mediumTierOverrides) {
    return {
      ...config,
      ...config.mediumTierOverrides,
      slug: config.slug,
      category: config.category,
      displayName: config.displayName,
      procedural: config.procedural,
    };
  }
  
  return config;
}

/**
 * Get all registered product slugs.
 */
export function getRegisteredSlugs(): string[] {
  return Array.from(productRegistry.keys());
}

/**
 * Check if a slug is registered.
 */
export function isSlugRegistered(slug: string): boolean {
  return productRegistry.has(slug);
}

/**
 * Get the fallback configuration.
 */
export function getFallbackConfig(): ProductRendererConfig {
  return { ...FALLBACK_CONFIG };
}

/**
 * Get products by category.
 */
export function getProductsByCategory(category: ProductCategory): ProductRendererConfig[] {
  const results: ProductRendererConfig[] = [];
  productRegistry.forEach((config) => {
    if (config.category === category) {
      results.push(config);
    }
  });
  return results;
}
