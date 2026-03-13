/**
 * Device Capability Detection and Quality Tier Assignment
 * 
 * Automatically detects device capabilities and assigns an appropriate
 * quality tier for Three.js rendering.
 * 
 * Priority: Performance-first - defaults to LOW tier when uncertain
 * Baseline: 8GB RAM laptop with integrated graphics = LOW tier
 * 
 * Features:
 * - Reduced motion preference detection (respects prefers-reduced-motion)
 * - Runtime telemetry with fallback counters
 * - Frame time tracking for dynamic tier adjustment
 */

import type { DeviceCapabilities, QualityTier } from './types';

// =============================================================================
// MOTION PREFERENCES
// =============================================================================

/**
 * Cached reduced motion preference.
 * null = not yet detected, true/false = user preference
 */
let cachedReducedMotion: boolean | null = null;

/**
 * Detect if user prefers reduced motion.
 * Caches result and listens for preference changes.
 */
export function prefersReducedMotion(): boolean {
  if (cachedReducedMotion !== null) {
    return cachedReducedMotion;
  }

  if (typeof window === 'undefined' || !window.matchMedia) {
    cachedReducedMotion = false;
    return false;
  }

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  cachedReducedMotion = mediaQuery.matches;

  // Listen for changes
  try {
    mediaQuery.addEventListener('change', (event) => {
      cachedReducedMotion = event.matches;
      // Clear tier cache to re-evaluate with new motion preference
      cachedTier = null;
    });
  } catch {
    // Fallback for older browsers
    mediaQuery.addListener((event) => {
      cachedReducedMotion = event.matches;
      cachedTier = null;
    });
  }

  return cachedReducedMotion;
}

/**
 * Force reduced motion setting (for testing or user override).
 * Pass null to reset to auto-detection.
 */
export function forceReducedMotion(enabled: boolean | null): void {
  cachedReducedMotion = enabled;
  // Clear tier cache to re-evaluate
  cachedTier = null;
}

// =============================================================================
// RUNTIME TELEMETRY
// =============================================================================

/**
 * Telemetry counters for monitoring system health.
 */
interface TelemetryCounters {
  /** Number of fallback renders (unknown slugs) */
  fallbackRenders: number;
  /** Number of asset load failures */
  assetLoadFailures: number;
  /** Number of tier downgrades due to performance */
  tierDowngrades: number;
  /** Number of renders per tier */
  rendersByTier: Record<QualityTier, number>;
  /** Frame drop events (>100ms frame time) */
  frameDrops: number;
  /** Total frames rendered */
  totalFrames: number;
  /** Session start timestamp */
  sessionStart: number;
}

const telemetry: TelemetryCounters = {
  fallbackRenders: 0,
  assetLoadFailures: 0,
  tierDowngrades: 0,
  rendersByTier: { low: 0, medium: 0, high: 0 },
  frameDrops: 0,
  totalFrames: 0,
  sessionStart: Date.now(),
};

/**
 * Increment fallback render counter.
 * Call when a fallback silhouette is rendered due to unknown slug.
 */
export function recordFallbackRender(): void {
  telemetry.fallbackRenders++;
}

/**
 * Increment asset load failure counter.
 * Call when a texture or model fails to load.
 */
export function recordAssetLoadFailure(): void {
  telemetry.assetLoadFailures++;
}

/**
 * Increment tier downgrade counter.
 * Call when tier is reduced due to poor performance.
 */
export function recordTierDowngrade(): void {
  telemetry.tierDowngrades++;
}

/**
 * Record a render for the specified tier.
 */
export function recordRender(tier: QualityTier): void {
  telemetry.rendersByTier[tier]++;
}

/**
 * Record a frame with its time.
 * Tracks frame drops for telemetry.
 */
export function recordFrame(frameTimeMs: number): void {
  telemetry.totalFrames++;
  if (frameTimeMs > 100) {
    telemetry.frameDrops++;
  }
  recordFrameTime(frameTimeMs);
}

/**
 * Get current telemetry snapshot.
 */
export function getTelemetry(): Readonly<TelemetryCounters> {
  return { ...telemetry };
}

/**
 * Get telemetry summary for logging/debugging.
 */
export function getTelemetrySummary(): string {
  const sessionDuration = (Date.now() - telemetry.sessionStart) / 1000;
  const avgFPS = telemetry.totalFrames / sessionDuration;
  const dropRate = telemetry.totalFrames > 0 
    ? (telemetry.frameDrops / telemetry.totalFrames * 100).toFixed(2)
    : '0.00';

  return [
    `[Product3D Telemetry]`,
    `Session: ${sessionDuration.toFixed(1)}s`,
    `Renders: low=${telemetry.rendersByTier.low} med=${telemetry.rendersByTier.medium} high=${telemetry.rendersByTier.high}`,
    `Fallbacks: ${telemetry.fallbackRenders}`,
    `Asset failures: ${telemetry.assetLoadFailures}`,
    `Tier downgrades: ${telemetry.tierDowngrades}`,
    `Frame drops: ${telemetry.frameDrops} (${dropRate}%)`,
    `Avg FPS: ${avgFPS.toFixed(1)}`,
  ].join(' | ');
}

/**
 * Reset telemetry counters.
 */
export function resetTelemetry(): void {
  telemetry.fallbackRenders = 0;
  telemetry.assetLoadFailures = 0;
  telemetry.tierDowngrades = 0;
  telemetry.rendersByTier = { low: 0, medium: 0, high: 0 };
  telemetry.frameDrops = 0;
  telemetry.totalFrames = 0;
  telemetry.sessionStart = Date.now();
}

// =============================================================================
// DETECTION UTILITIES
// =============================================================================

/**
 * WebGL context for capability detection.
 * Cached after first detection.
 */
let cachedCapabilities: DeviceCapabilities | null = null;
let cachedTier: QualityTier | null = null;

/**
 * Known low-end GPU patterns (integrated graphics).
 * These GPUs should always get LOW tier.
 */
const LOW_END_GPU_PATTERNS = [
  /intel.*uhd/i,
  /intel.*hd/i,
  /intel.*iris/i,
  /intel.*graphics/i,
  /amd.*vega/i,
  /amd.*radeon.*graphics/i, // APU graphics
  /mali/i,
  /adreno/i,
  /powervr/i,
  /apple.*gpu/i, // Older Apple GPUs
  /swiftshader/i, // Software renderer
  /llvmpipe/i, // Software renderer
  /mesa/i,
];

/**
 * Known high-end GPU patterns.
 * These GPUs can handle HIGH tier.
 */
const HIGH_END_GPU_PATTERNS = [
  /nvidia.*rtx.*[3-4][0-9]{3}/i, // RTX 3000/4000 series
  /nvidia.*rtx.*[5-9][0-9]{3}/i, // Future RTX series
  /amd.*rx.*[6-7][0-9]{3}/i, // RX 6000/7000 series
  /radeon.*rx.*[6-7][0-9]{3}/i,
  /apple.*m[2-9]/i, // Apple M2+
  /apple.*m[1-9][0-9]/i, // Apple M10+
];

/**
 * Known medium-tier GPU patterns.
 */
const MEDIUM_GPU_PATTERNS = [
  /nvidia.*gtx.*1[6-9][0-9]{2}/i, // GTX 1600 series
  /nvidia.*rtx.*20[0-9]{2}/i, // RTX 2000 series
  /nvidia.*rtx.*30[0-5]0/i, // RTX 3050/3060
  /amd.*rx.*5[0-9]{3}/i, // RX 5000 series
  /radeon.*rx.*5[0-9]{3}/i,
  /apple.*m1/i, // Apple M1
  /nvidia.*gtx.*10[0-9]{2}/i, // GTX 1000 series
];

// =============================================================================
// CAPABILITY DETECTION
// =============================================================================

/**
 * Detect device capabilities using WebGL context.
 * Returns cached result if available.
 */
export function detectCapabilities(): DeviceCapabilities {
  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  // Default capabilities (assume low-end)
  const capabilities: DeviceCapabilities = {
    gpuTier: 0,
    deviceMemory: null,
    hardwareConcurrency: 2,
    isMobile: false,
    renderer: 'unknown',
    maxTextureSize: 2048,
    maxVertexUniforms: 128,
    webgl2: false,
  };

  // Check if we're in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    cachedCapabilities = capabilities;
    return capabilities;
  }

  // Detect mobile
  capabilities.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Get device memory (Chrome only)
  if ('deviceMemory' in navigator) {
    capabilities.deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
  }

  // Get hardware concurrency
  if ('hardwareConcurrency' in navigator) {
    capabilities.hardwareConcurrency = navigator.hardwareConcurrency || 2;
  }

  // Create temporary canvas for WebGL detection
  const canvas = document.createElement('canvas');
  
  // Try WebGL2 first
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = canvas.getContext('webgl2');
  if (gl) {
    capabilities.webgl2 = true;
  } else {
    // Fall back to WebGL1
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
  }

  if (gl) {
    // Get GPU renderer string
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      capabilities.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
    }

    // Get max texture size
    capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;

    // Get max vertex uniforms
    capabilities.maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 128;

    // Determine GPU tier based on renderer string
    capabilities.gpuTier = detectGPUTier(capabilities.renderer);
  }

  // Clean up
  canvas.remove();

  cachedCapabilities = capabilities;
  return capabilities;
}

/**
 * Detect GPU tier from renderer string.
 * Returns 0-3 where 0 is lowest and 3 is highest.
 */
function detectGPUTier(renderer: string): number {
  const rendererLower = renderer.toLowerCase();

  // Check for high-end GPUs first (tier 3)
  for (const pattern of HIGH_END_GPU_PATTERNS) {
    if (pattern.test(rendererLower)) {
      return 3;
    }
  }

  // Check for medium GPUs (tier 2)
  for (const pattern of MEDIUM_GPU_PATTERNS) {
    if (pattern.test(rendererLower)) {
      return 2;
    }
  }

  // Check for known low-end GPUs (tier 0)
  for (const pattern of LOW_END_GPU_PATTERNS) {
    if (pattern.test(rendererLower)) {
      return 0;
    }
  }

  // Unknown GPU - assume tier 1 (low-medium)
  return 1;
}

// =============================================================================
// TIER DETECTION
// =============================================================================

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

/**
 * Get animation settings based on tier and motion preferences.
 * Respects prefers-reduced-motion media query.
 */
export function getAnimationSettings(tier?: QualityTier): AnimationSettings {
  const activeTier = tier ?? detectQualityTier();
  const reducedMotion = prefersReducedMotion();

  // If user prefers reduced motion, disable most animations
  if (reducedMotion) {
    return {
      enabled: true, // Keep basic rendering
      reducedMotion: true,
      idleRotation: false,
      hoverEffects: false,
      entryAnimations: false,
      autoRotate: false,
      speedMultiplier: 0,
    };
  }

  // Tier-based animation settings
  switch (activeTier) {
    case 'high':
      return {
        enabled: true,
        reducedMotion: false,
        idleRotation: true,
        hoverEffects: true,
        entryAnimations: true,
        autoRotate: true,
        speedMultiplier: 1.0,
      };
    case 'medium':
      return {
        enabled: true,
        reducedMotion: false,
        idleRotation: true,
        hoverEffects: true,
        entryAnimations: false, // Skip entry animations on medium
        autoRotate: true,
        speedMultiplier: 0.8,
      };
    case 'low':
    default:
      return {
        enabled: true,
        reducedMotion: false,
        idleRotation: true, // Keep basic rotation
        hoverEffects: false, // No hover effects
        entryAnimations: false, // No entry animations
        autoRotate: false, // No auto-rotate
        speedMultiplier: 0.5, // Slower for smoother on low-end
      };
  }
}

/**
 * Detect the appropriate quality tier for the current device.
 * 
 * Priority: Performance-first - biases toward lower tiers when uncertain.
 * 
 * @param forceRefresh - Bypass cache and re-detect
 * @returns Quality tier ('low', 'medium', or 'high')
 */
export function detectQualityTier(forceRefresh = false): QualityTier {
  if (cachedTier && !forceRefresh) {
    return cachedTier;
  }

  const capabilities = detectCapabilities();
  let tier: QualityTier = 'low';

  // Scoring system for tier detection
  let score = 0;

  // GPU tier contributes most to score (0-6 points)
  score += capabilities.gpuTier * 2;

  // Device memory contributes (0-3 points)
  if (capabilities.deviceMemory !== null) {
    if (capabilities.deviceMemory >= 16) {
      score += 3;
    } else if (capabilities.deviceMemory >= 8) {
      score += 2;
    } else if (capabilities.deviceMemory >= 4) {
      score += 1;
    }
  }

  // Hardware concurrency contributes (0-2 points)
  if (capabilities.hardwareConcurrency >= 8) {
    score += 2;
  } else if (capabilities.hardwareConcurrency >= 4) {
    score += 1;
  }

  // WebGL2 support contributes (0-1 points)
  if (capabilities.webgl2) {
    score += 1;
  }

  // Max texture size contributes (0-2 points)
  if (capabilities.maxTextureSize >= 8192) {
    score += 2;
  } else if (capabilities.maxTextureSize >= 4096) {
    score += 1;
  }

  // Mobile devices get penalized (harder to cool, battery concerns)
  if (capabilities.isMobile) {
    score -= 2;
  }

  // Determine tier from score
  // Conservative thresholds - bias toward lower tiers
  if (score >= 10) {
    tier = 'high';
  } else if (score >= 6) {
    tier = 'medium';
  } else {
    tier = 'low';
  }

  cachedTier = tier;
  return tier;
}

/**
 * Get both capabilities and tier in one call.
 */
export function getDeviceProfile(): { 
  capabilities: DeviceCapabilities; 
  tier: QualityTier;
  animationSettings: AnimationSettings;
  reducedMotion: boolean;
} {
  const capabilities = detectCapabilities();
  const tier = detectQualityTier();
  const animationSettings = getAnimationSettings(tier);
  return { 
    capabilities, 
    tier, 
    animationSettings,
    reducedMotion: prefersReducedMotion(),
  };
}

// =============================================================================
// RUNTIME ADJUSTMENTS
// =============================================================================

/**
 * Force a specific tier (for debugging or user preference).
 * Pass null to reset to auto-detection.
 */
export function forceQualityTier(tier: QualityTier | null): void {
  cachedTier = tier;
}

/**
 * Clear all cached detection data.
 * Useful for re-detecting after context changes.
 */
export function clearDetectionCache(): void {
  cachedCapabilities = null;
  cachedTier = null;
}

/**
 * Check if the device can handle a specific tier.
 * Returns true if the device's detected tier is >= the requested tier.
 */
export function canHandleTier(requestedTier: QualityTier): boolean {
  const currentTier = detectQualityTier();
  const tierOrder: QualityTier[] = ['low', 'medium', 'high'];
  
  const currentIndex = tierOrder.indexOf(currentTier);
  const requestedIndex = tierOrder.indexOf(requestedTier);
  
  return currentIndex >= requestedIndex;
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Frame time history for runtime tier adjustment.
 */
const frameTimeHistory: number[] = [];
const MAX_FRAME_HISTORY = 60;

/**
 * Record a frame time for performance monitoring.
 * Can be used to dynamically adjust tier if performance is poor.
 */
export function recordFrameTime(frameTimeMs: number): void {
  frameTimeHistory.push(frameTimeMs);
  if (frameTimeHistory.length > MAX_FRAME_HISTORY) {
    frameTimeHistory.shift();
  }
}

/**
 * Get average frame time from recent history.
 */
export function getAverageFrameTime(): number {
  if (frameTimeHistory.length === 0) return 0;
  const sum = frameTimeHistory.reduce((a, b) => a + b, 0);
  return sum / frameTimeHistory.length;
}

/**
 * Check if we should consider downgrading tier based on performance.
 * Returns true if average frame time exceeds threshold.
 */
export function shouldDowngradeTier(targetFPS = 30): boolean {
  const avgFrameTime = getAverageFrameTime();
  const targetFrameTime = 1000 / targetFPS;
  
  // If average frame time is 50% over target, suggest downgrade
  return avgFrameTime > targetFrameTime * 1.5;
}

/**
 * Suggest a tier based on actual runtime performance.
 * Uses recorded frame times to recommend appropriate tier.
 */
export function suggestTierFromPerformance(): QualityTier {
  const avgFrameTime = getAverageFrameTime();
  
  if (avgFrameTime === 0) {
    // No data yet, use detected tier
    return detectQualityTier();
  }
  
  // Frame time thresholds
  if (avgFrameTime <= 16.67) {
    // 60fps capable
    return 'high';
  } else if (avgFrameTime <= 33.33) {
    // 30fps capable
    return 'medium';
  } else {
    // Below 30fps
    return 'low';
  }
}
