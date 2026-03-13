/**
 * Performance Budget Constants
 * 
 * Defines hard limits for each quality tier.
 * Priority: Performance-first for low-RAM/integrated-GPU hardware
 * Baseline: 8GB RAM laptop with integrated graphics
 * 
 * These budgets follow the skill guidelines for Three.js optimization.
 */

import type { PerformanceBudget, QualityTier } from './types';

// =============================================================================
// PERFORMANCE BUDGETS BY TIER
// =============================================================================

/**
 * Low tier budget - baseline hardware (8GB RAM, integrated GPU)
 * 
 * This is the default tier for most users and must run smoothly
 * on integrated graphics like Intel UHD or AMD Vega.
 */
export const LOW_TIER_BUDGET: PerformanceBudget = {
  maxDrawCalls: 80,
  maxTriangles: 60_000,
  maxTextureMemoryMB: 64,
  maxTextureResolution: 1024,
  maxDPR: 1.25,
  minDPR: 1.0,
  enableShadows: false,
  shadowMapSize: 0,
  enablePostProcessing: false,
  enableAntialias: false,
  targetFPS: 30,
};

/**
 * Medium tier budget - mid-range hardware (16GB RAM, dedicated entry-level GPU)
 * 
 * For users with dedicated GPUs like GTX 1650, RTX 3050, or equivalent.
 */
export const MEDIUM_TIER_BUDGET: PerformanceBudget = {
  maxDrawCalls: 150,
  maxTriangles: 150_000,
  maxTextureMemoryMB: 128,
  maxTextureResolution: 2048,
  maxDPR: 1.5,
  minDPR: 1.0,
  enableShadows: true,
  shadowMapSize: 1024,
  enablePostProcessing: false,
  enableAntialias: true,
  targetFPS: 60,
};

/**
 * High tier budget - high-end hardware (32GB+ RAM, powerful dedicated GPU)
 * 
 * For users with RTX 3070+, RX 6800+, or equivalent.
 */
export const HIGH_TIER_BUDGET: PerformanceBudget = {
  maxDrawCalls: 300,
  maxTriangles: 500_000,
  maxTextureMemoryMB: 256,
  maxTextureResolution: 4096,
  maxDPR: 2.0,
  minDPR: 1.0,
  enableShadows: true,
  shadowMapSize: 2048,
  enablePostProcessing: true,
  enableAntialias: true,
  targetFPS: 60,
};

/**
 * Get performance budget for a quality tier.
 */
export function getPerformanceBudget(tier: QualityTier): PerformanceBudget {
  switch (tier) {
    case 'low':
      return LOW_TIER_BUDGET;
    case 'medium':
      return MEDIUM_TIER_BUDGET;
    case 'high':
      return HIGH_TIER_BUDGET;
    default:
      return LOW_TIER_BUDGET;
  }
}

// =============================================================================
// TEXTURE SIZE LIMITS
// =============================================================================

/**
 * Maximum texture dimensions by tier.
 * Used for runtime texture resizing/selection.
 */
export const TEXTURE_SIZE_LIMITS: Record<QualityTier, number> = {
  low: 1024,
  medium: 2048,
  high: 4096,
};

/**
 * Texture format preferences by tier.
 * Lower tiers should prefer compressed formats.
 */
export const TEXTURE_FORMATS: Record<QualityTier, string[]> = {
  low: ['basis', 'ktx2', 'webp', 'jpg'],
  medium: ['ktx2', 'webp', 'png', 'jpg'],
  high: ['ktx2', 'png', 'jpg'],
};

// =============================================================================
// GEOMETRY COMPLEXITY
// =============================================================================

/**
 * Segment multipliers for procedural geometry by tier.
 * Applied to base segment counts.
 */
export const GEOMETRY_SEGMENT_MULTIPLIERS: Record<QualityTier, number> = {
  low: 0.5,
  medium: 1.0,
  high: 2.0,
};

/**
 * Default segment counts for primitive shapes by tier.
 */
export const DEFAULT_SEGMENTS: Record<QualityTier, { box: number; cylinder: number; sphere: number }> = {
  low: { box: 1, cylinder: 16, sphere: 16 },
  medium: { box: 1, cylinder: 32, sphere: 32 },
  high: { box: 1, cylinder: 64, sphere: 64 },
};

// =============================================================================
// RENDERING SETTINGS
// =============================================================================

/**
 * WebGL renderer settings by tier.
 */
export const RENDERER_SETTINGS: Record<QualityTier, {
  powerPreference: 'low-power' | 'default' | 'high-performance';
  precision: 'lowp' | 'mediump' | 'highp';
  logarithmicDepthBuffer: boolean;
  stencil: boolean;
}> = {
  low: {
    powerPreference: 'low-power',
    precision: 'mediump',
    logarithmicDepthBuffer: false,
    stencil: false,
  },
  medium: {
    powerPreference: 'default',
    precision: 'highp',
    logarithmicDepthBuffer: false,
    stencil: true,
  },
  high: {
    powerPreference: 'high-performance',
    precision: 'highp',
    logarithmicDepthBuffer: true,
    stencil: true,
  },
};

/**
 * Shadow map settings by tier.
 */
export const SHADOW_SETTINGS: Record<QualityTier, {
  enabled: boolean;
  type: 'basic' | 'pcf' | 'pcfsoft' | 'vsm';
  mapSize: number;
}> = {
  low: {
    enabled: false,
    type: 'basic',
    mapSize: 0,
  },
  medium: {
    enabled: true,
    type: 'pcf',
    mapSize: 1024,
  },
  high: {
    enabled: true,
    type: 'pcfsoft',
    mapSize: 2048,
  },
};

// =============================================================================
// MATERIAL SETTINGS
// =============================================================================

/**
 * Material type preferences by tier.
 * Lower tiers use simpler materials.
 */
export const MATERIAL_TYPE_BY_TIER: Record<QualityTier, 'basic' | 'lambert' | 'standard' | 'physical'> = {
  low: 'lambert',
  medium: 'standard',
  high: 'physical',
};

/**
 * Environment map settings by tier.
 */
export const ENVMAP_SETTINGS: Record<QualityTier, {
  enabled: boolean;
  resolution: number;
  intensity: number;
}> = {
  low: {
    enabled: false,
    resolution: 0,
    intensity: 0,
  },
  medium: {
    enabled: true,
    resolution: 256,
    intensity: 0.5,
  },
  high: {
    enabled: true,
    resolution: 512,
    intensity: 1.0,
  },
};

// =============================================================================
// ANIMATION SETTINGS
// =============================================================================

/**
 * Animation settings by tier.
 */
export const ANIMATION_SETTINGS: Record<QualityTier, {
  enableIdleRotation: boolean;
  enableHoverEffects: boolean;
  enableEntryAnimation: boolean;
  maxSimultaneousAnimations: number;
}> = {
  low: {
    enableIdleRotation: true,
    enableHoverEffects: false,
    enableEntryAnimation: false,
    maxSimultaneousAnimations: 1,
  },
  medium: {
    enableIdleRotation: true,
    enableHoverEffects: true,
    enableEntryAnimation: true,
    maxSimultaneousAnimations: 3,
  },
  high: {
    enableIdleRotation: true,
    enableHoverEffects: true,
    enableEntryAnimation: true,
    maxSimultaneousAnimations: 10,
  },
};

// =============================================================================
// CACHE SETTINGS
// =============================================================================

/**
 * Asset cache limits by tier.
 */
export const CACHE_LIMITS: Record<QualityTier, {
  maxMemoryMB: number;
  maxAssets: number;
  ttlMs: number;
}> = {
  low: {
    maxMemoryMB: 64,
    maxAssets: 10,
    ttlMs: 60_000, // 1 minute
  },
  medium: {
    maxMemoryMB: 128,
    maxAssets: 25,
    ttlMs: 300_000, // 5 minutes
  },
  high: {
    maxMemoryMB: 256,
    maxAssets: 50,
    ttlMs: 600_000, // 10 minutes
  },
};

// =============================================================================
// DEMAND RENDERING
// =============================================================================

/**
 * Frame throttling settings by tier.
 * Used with frameloop="demand" to control update frequency.
 */
export const FRAME_THROTTLE: Record<QualityTier, {
  minFrameTime: number; // milliseconds
  idleFrameTime: number; // milliseconds when not interacting
}> = {
  low: {
    minFrameTime: 33, // ~30fps max
    idleFrameTime: 100, // 10fps when idle
  },
  medium: {
    minFrameTime: 16, // ~60fps max
    idleFrameTime: 50, // 20fps when idle
  },
  high: {
    minFrameTime: 16, // ~60fps max
    idleFrameTime: 33, // 30fps when idle
  },
};

// =============================================================================
// LOD SETTINGS
// =============================================================================

/**
 * Level of Detail distance thresholds by tier.
 * Distances at which to switch LOD levels.
 */
export const LOD_DISTANCES: Record<QualityTier, {
  high: number;
  medium: number;
  low: number;
}> = {
  low: {
    high: 2,
    medium: 4,
    low: 8,
  },
  medium: {
    high: 3,
    medium: 6,
    low: 12,
  },
  high: {
    high: 5,
    medium: 10,
    low: 20,
  },
};
