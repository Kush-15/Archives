/**
 * Product 3D Renderer Type Definitions
 * 
 * Skill-guided architecture contract for slug-driven Three.js product rendering.
 * Follows guidelines from .agents/.agents/skills/threejs-[skill]/SKILL.md
 * 
 * Priority: Performance-first for low-RAM/integrated-GPU hardware
 * Baseline: 8GB RAM laptop with integrated graphics
 */

import type { ReactNode } from 'react';

// =============================================================================
// QUALITY TIERS
// =============================================================================

/**
 * Quality tier levels for automatic device-based scaling.
 * Detection is automatic based on device capabilities.
 */
export type QualityTier = 'low' | 'medium' | 'high';

/**
 * Device capability profile detected at runtime.
 */
export interface DeviceCapabilities {
  /** Estimated GPU tier (0-3, where 0 is lowest) */
  gpuTier: number;
  /** Device memory in GB (navigator.deviceMemory) */
  deviceMemory: number | null;
  /** Number of logical CPU cores */
  hardwareConcurrency: number;
  /** Whether device is mobile */
  isMobile: boolean;
  /** WebGL renderer string for GPU identification */
  renderer: string;
  /** Maximum texture size supported */
  maxTextureSize: number;
  /** Maximum vertex uniform vectors */
  maxVertexUniforms: number;
  /** Whether WebGL2 is supported */
  webgl2: boolean;
}

// =============================================================================
// PERFORMANCE BUDGETS
// =============================================================================

/**
 * Performance budget constraints per quality tier.
 * These are hard limits that must not be exceeded.
 */
export interface PerformanceBudget {
  /** Maximum draw calls per product scene */
  maxDrawCalls: number;
  /** Maximum visible triangles */
  maxTriangles: number;
  /** Maximum texture memory in MB */
  maxTextureMemoryMB: number;
  /** Maximum texture resolution (e.g., 512, 1024, 2048) */
  maxTextureResolution: number;
  /** Device pixel ratio cap */
  maxDPR: number;
  /** Minimum device pixel ratio */
  minDPR: number;
  /** Enable shadow mapping */
  enableShadows: boolean;
  /** Shadow map size if enabled */
  shadowMapSize: number;
  /** Enable post-processing effects */
  enablePostProcessing: boolean;
  /** Enable antialiasing */
  enableAntialias: boolean;
  /** Target frame rate */
  targetFPS: number;
}

// =============================================================================
// PRODUCT CATEGORIES
// =============================================================================

/**
 * Product category types matching the existing product data structure.
 */
export type ProductCategory = 
  | 'audio'
  | 'photography'
  | 'computing'
  | 'gaming'
  | 'television';

/**
 * Known product slugs in the system.
 * These are the canonical slugs from products.ts
 */
export type ProductSlug =
  // Audio
  | 'sony-walkman-tps-l2'
  | 'braun-t1000'
  | 'technics-sl1200'
  // Photography
  | 'polaroid-sx-70'
  | 'hasselblad-500c'
  | 'leica-m3'
  // Computing
  | 'apple-macintosh-128k'
  | 'ibm-model-m'
  | 'commodore-64'
  // Gaming
  | 'nintendo-nes'
  | 'atari-2600'
  // Television
  | 'sony-trinitron-kv1310';

// =============================================================================
// RENDERER CONTRACT
// =============================================================================

/**
 * Asset definition for a product's 3D resources.
 */
export interface ProductAssets {
  /** Path to GLTF/GLB model (optional - uses procedural if not provided) */
  modelPath?: string;
  /** Paths to texture maps by type */
  textures?: {
    diffuse?: string;
    normal?: string;
    roughness?: string;
    metalness?: string;
    ao?: string;
    emissive?: string;
  };
  /** Low-quality texture variants for lower tiers */
  texturesLow?: {
    diffuse?: string;
  };
  /** Environment map path */
  envMap?: string;
}

/**
 * Geometry configuration for procedural generation.
 */
export interface ProceduralGeometryConfig {
  /** Base shape type */
  baseShape: 'box' | 'cylinder' | 'sphere' | 'custom';
  /** Dimensions [width, height, depth] or [radius, height] */
  dimensions: readonly number[] | number[];
  /** Segment counts for geometry detail [widthSegs, heightSegs, depthSegs] */
  segments: {
    low: readonly number[] | number[];
    medium: readonly number[] | number[];
    high: readonly number[] | number[];
  };
  /** Additional geometry features (buttons, dials, screens, etc.) */
  features?: ProceduralFeature[];
}

/**
 * A procedural feature to add to the base geometry.
 */
export interface ProceduralFeature {
  /** Feature type */
  type: 'button' | 'dial' | 'screen' | 'slot' | 'port' | 'lens' | 'speaker' | 'antenna' | 'custom';
  /** Position relative to base [x, y, z] */
  position: [number, number, number];
  /** Scale [x, y, z] */
  scale: [number, number, number];
  /** Rotation in radians [x, y, z] */
  rotation?: [number, number, number];
  /** Material override for this feature */
  material?: MaterialConfig;
}

/**
 * Material configuration following Three.js material guidelines.
 */
export interface MaterialConfig {
  /** Material type */
  type: 'standard' | 'physical' | 'basic' | 'lambert';
  /** Base color (hex or CSS color) */
  color: string;
  /** Metalness (0-1) */
  metalness?: number;
  /** Roughness (0-1) */
  roughness?: number;
  /** Emissive color */
  emissive?: string;
  /** Emissive intensity */
  emissiveIntensity?: number;
  /** Opacity (0-1) */
  opacity?: number;
  /** Whether material is transparent */
  transparent?: boolean;
  /** Environment map intensity */
  envMapIntensity?: number;
}

/**
 * Lighting configuration for the product scene.
 */
export interface LightingConfig {
  /** Ambient light intensity */
  ambientIntensity: number;
  /** Ambient light color */
  ambientColor: string;
  /** Key light configuration */
  keyLight?: {
    intensity: number;
    color: string;
    position: [number, number, number];
    castShadow?: boolean;
  };
  /** Fill light configuration */
  fillLight?: {
    intensity: number;
    color: string;
    position: [number, number, number];
  };
  /** Rim/back light configuration */
  rimLight?: {
    intensity: number;
    color: string;
    position: [number, number, number];
  };
  /** Use environment lighting */
  useEnvironment?: boolean;
  /** Environment preset or path */
  environment?: string;
}

/**
 * Animation configuration for the product.
 */
export interface AnimationConfig {
  /** Enable idle rotation */
  idleRotation?: {
    enabled: boolean;
    speed: number;
    axis: 'x' | 'y' | 'z';
  };
  /** Hover animation */
  hoverEffect?: {
    enabled: boolean;
    scale?: number;
    lift?: number;
    duration?: number;
  };
  /** Entry animation - type is optional when enabled is false */
  entryAnimation?: {
    enabled: boolean;
    type?: 'fade' | 'scale' | 'slide' | 'rotate';
    duration?: number;
    delay?: number;
  };
  /** GLTF animation clips to play */
  clips?: string[];
}

/**
 * Camera configuration for the product view.
 */
export interface CameraConfig {
  /** Initial camera position */
  position: [number, number, number];
  /** Look-at target */
  target: [number, number, number];
  /** Field of view */
  fov: number;
  /** Near clipping plane */
  near: number;
  /** Far clipping plane */
  far: number;
  /** Orbit controls configuration */
  controls?: {
    enabled: boolean;
    enableZoom?: boolean;
    enablePan?: boolean;
    minDistance?: number;
    maxDistance?: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    autoRotate?: boolean;
    autoRotateSpeed?: number;
    dampingFactor?: number;
  };
}

/**
 * Complete product renderer configuration.
 * This is the main contract for defining how a product is rendered.
 */
export interface ProductRendererConfig {
  /** Product slug (primary key) */
  slug: ProductSlug | string;
  /** Product category */
  category: ProductCategory;
  /** Display name for debugging/logging */
  displayName: string;
  
  // Asset Configuration
  /** Asset paths and resources */
  assets?: ProductAssets;
  /** Whether to use procedural generation (required if no model) */
  procedural: boolean;
  /** Procedural geometry config (required if procedural: true) */
  proceduralConfig?: ProceduralGeometryConfig;
  
  // Material Configuration
  /** Primary material settings */
  material: MaterialConfig;
  /** Secondary materials for parts */
  secondaryMaterials?: Record<string, MaterialConfig>;
  
  // Scene Configuration
  /** Lighting setup */
  lighting: LightingConfig;
  /** Camera setup */
  camera: CameraConfig;
  /** Animation settings */
  animation?: AnimationConfig;
  
  // Performance Hints
  /** Complexity hint for tier scaling */
  complexity: 'simple' | 'moderate' | 'complex';
  /** Estimated triangle count at high quality */
  estimatedTriangles?: number;
  /** Estimated texture memory at high quality (MB) */
  estimatedTextureMemory?: number;
  
  // Tier-specific overrides
  /** Low tier configuration overrides */
  lowTierOverrides?: Partial<ProductRendererConfig>;
  /** Medium tier configuration overrides */
  mediumTierOverrides?: Partial<ProductRendererConfig>;
}

// =============================================================================
// REGISTRY TYPES
// =============================================================================

/**
 * Product registry mapping slugs to renderer configs.
 */
export type ProductRegistry = Map<ProductSlug | string, ProductRendererConfig>;

/**
 * Registry lookup result.
 */
export interface RegistryLookupResult {
  /** Found configuration */
  config: ProductRendererConfig;
  /** Quality tier applied */
  tier: QualityTier;
  /** Performance budget for this tier */
  budget: PerformanceBudget;
  /** Whether fallback was used */
  isFallback: boolean;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props for the main Product3DRenderer component.
 */
export interface Product3DRendererProps {
  /** Product slug to render */
  slug: ProductSlug | string;
  /** Override quality tier (auto-detected if not provided) */
  tier?: QualityTier;
  /** Container className */
  className?: string;
  /** Container style */
  style?: React.CSSProperties;
  /** Callback when model loads */
  onLoad?: () => void;
  /** Callback on load error */
  onError?: (error: Error) => void;
  /** Whether to show loading indicator */
  showLoader?: boolean;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Enable interaction (orbit controls) */
  interactive?: boolean;
  /** Enable auto-rotation */
  autoRotate?: boolean;
}

/**
 * Internal render context passed to product components.
 */
export interface Product3DContext {
  /** Active quality tier */
  tier: QualityTier;
  /** Performance budget */
  budget: PerformanceBudget;
  /** Device capabilities */
  capabilities: DeviceCapabilities;
  /** Animation settings (respects reduced motion) */
  animationSettings: AnimationSettings;
  /** Request frame invalidation (for demand rendering) */
  invalidate: () => void;
}

/**
 * Animation settings derived from tier and motion preferences.
 */
export interface AnimationSettings {
  /** Whether animations are enabled at all */
  enabled: boolean;
  /** Whether to use reduced motion (simplified animations) */
  reducedMotion: boolean;
  /** Idle rotation enabled */
  idleRotation: boolean;
  /** Hover effects enabled */
  hoverEffects: boolean;
  /** Entry animations enabled */
  entryAnimations: boolean;
  /** Auto-rotate camera enabled */
  autoRotate: boolean;
  /** Animation speed multiplier (1.0 = normal) */
  speedMultiplier: number;
}

// =============================================================================
// ASSET LOADING TYPES
// =============================================================================

/**
 * Asset loading status.
 */
export type AssetLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Cached asset entry.
 */
export interface CachedAsset<T = unknown> {
  /** The loaded asset */
  data: T;
  /** Load timestamp */
  loadedAt: number;
  /** Approximate memory size in bytes */
  sizeBytes: number;
  /** Reference count for disposal */
  refCount: number;
}

/**
 * Asset cache statistics.
 */
export interface AssetCacheStats {
  /** Total cached assets */
  count: number;
  /** Total memory usage in bytes */
  totalMemory: number;
  /** Cache hit rate (0-1) */
  hitRate: number;
}
