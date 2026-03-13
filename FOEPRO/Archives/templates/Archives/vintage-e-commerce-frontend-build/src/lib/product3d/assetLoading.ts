/**
 * Centralized Asset Loading System
 * 
 * Skill-guided asset management for Three.js product rendering.
 * Follows threejs-loaders and threejs-textures skill guidelines:
 * - LoadingManager for progress tracking
 * - Bounded memory caches with LRU eviction
 * - Proper texture color-space handling
 * - Graceful degradation on load failures
 * 
 * Priority: Performance-first for low-RAM/integrated-GPU hardware
 * Baseline: 8GB RAM laptop with integrated graphics
 */

import * as THREE from 'three';
import type { QualityTier, CachedAsset, AssetCacheStats } from './types';
import { recordAssetLoadFailure } from './tierDetection';
import { getPerformanceBudget } from './constants';

// =============================================================================
// LOADING MANAGER
// =============================================================================

/**
 * Central loading manager for all Three.js assets.
 * Provides unified progress tracking and error handling.
 */
const loadingManager = new THREE.LoadingManager();

// Loading state
let isLoading = false;
let loadProgress = 0;
let loadError: Error | null = null;

// Callbacks
type ProgressCallback = (progress: number) => void;
type ErrorCallback = (error: Error) => void;
const progressCallbacks = new Set<ProgressCallback>();
const errorCallbacks = new Set<ErrorCallback>();

loadingManager.onStart = () => {
  isLoading = true;
  loadProgress = 0;
  loadError = null;
};

loadingManager.onProgress = (_url, loaded, total) => {
  loadProgress = total > 0 ? loaded / total : 0;
  progressCallbacks.forEach((cb) => cb(loadProgress));
};

loadingManager.onLoad = () => {
  isLoading = false;
  loadProgress = 1;
};

loadingManager.onError = (url) => {
  const error = new Error(`Failed to load asset: ${url}`);
  loadError = error;
  recordAssetLoadFailure();
  errorCallbacks.forEach((cb) => cb(error));
};

/**
 * Subscribe to loading progress updates.
 */
export function onLoadProgress(callback: ProgressCallback): () => void {
  progressCallbacks.add(callback);
  return () => progressCallbacks.delete(callback);
}

/**
 * Subscribe to loading error events.
 */
export function onLoadError(callback: ErrorCallback): () => void {
  errorCallbacks.add(callback);
  return () => errorCallbacks.delete(callback);
}

/**
 * Get current loading state.
 */
export function getLoadingState(): {
  isLoading: boolean;
  progress: number;
  error: Error | null;
} {
  return { isLoading, progress: loadProgress, error: loadError };
}

// =============================================================================
// TEXTURE CACHE
// =============================================================================

/**
 * Memory budget for texture cache in bytes.
 * Derived from tier-specific limits.
 */
const TEXTURE_CACHE_BUDGET: Record<QualityTier, number> = {
  low: 64 * 1024 * 1024,    // 64MB
  medium: 128 * 1024 * 1024, // 128MB
  high: 256 * 1024 * 1024,   // 256MB
};

/**
 * Texture cache with LRU eviction.
 */
const textureCache = new Map<string, CachedAsset<THREE.Texture>>();
let textureCacheMemory = 0;
let textureCacheHits = 0;
let textureCacheRequests = 0;

/**
 * Estimate texture memory size in bytes.
 */
function estimateTextureMemory(texture: THREE.Texture): number {
  const image = texture.image as { width?: number; height?: number } | undefined;
  if (!image) return 0;

  const width = image.width ?? 1;
  const height = image.height ?? 1;
  
  // 4 bytes per pixel (RGBA), with mipmaps ~33% overhead
  const baseSize = width * height * 4;
  const mipmapOverhead = texture.generateMipmaps ? 0.33 : 0;
  
  return Math.ceil(baseSize * (1 + mipmapOverhead));
}

/**
 * Evict least recently used textures until under budget.
 */
function evictTextures(budget: number): void {
  if (textureCacheMemory <= budget) return;

  // Convert to array and sort by loadedAt (oldest first)
  const entries = Array.from(textureCache.entries())
    .filter(([, asset]) => asset.refCount === 0)
    .sort((a, b) => a[1].loadedAt - b[1].loadedAt);

  for (const [key, asset] of entries) {
    if (textureCacheMemory <= budget) break;

    asset.data.dispose();
    textureCacheMemory -= asset.sizeBytes;
    textureCache.delete(key);
  }
}

/**
 * Texture loader instance.
 */
const textureLoader = new THREE.TextureLoader(loadingManager);

/**
 * Load a texture with caching and tier-appropriate settings.
 */
export async function loadTexture(
  url: string,
  tier: QualityTier,
  options?: {
    colorSpace?: THREE.ColorSpace;
    wrapS?: THREE.Wrapping;
    wrapT?: THREE.Wrapping;
    flipY?: boolean;
  }
): Promise<THREE.Texture> {
  textureCacheRequests++;
  const cacheKey = `${url}_${tier}`;

  // Check cache
  if (textureCache.has(cacheKey)) {
    const cached = textureCache.get(cacheKey)!;
    cached.refCount++;
    cached.loadedAt = Date.now(); // Update for LRU
    textureCacheHits++;
    return cached.data;
  }

  // Evict if needed before loading
  const budget = TEXTURE_CACHE_BUDGET[tier];
  evictTextures(budget * 0.8); // Keep 20% headroom

  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      (texture) => {
        // Apply tier-appropriate settings
        const performanceBudget = getPerformanceBudget(tier);
        
        // Limit texture resolution for low-tier
        if (texture.image && tier === 'low') {
          const maxRes = performanceBudget.maxTextureResolution;
          if (texture.image.width > maxRes || texture.image.height > maxRes) {
            // Resize would require canvas manipulation
            // Instead, we'll just configure the texture to use lower mip levels
            texture.minFilter = THREE.LinearMipmapNearestFilter;
          }
        }

        // Apply color space (sRGB for diffuse, Linear for data textures)
        texture.colorSpace = options?.colorSpace ?? THREE.SRGBColorSpace;
        
        // Apply wrap modes
        texture.wrapS = options?.wrapS ?? THREE.ClampToEdgeWrapping;
        texture.wrapT = options?.wrapT ?? THREE.ClampToEdgeWrapping;
        
        // Apply flipY
        if (options?.flipY !== undefined) {
          texture.flipY = options.flipY;
        }

        // Generate mipmaps based on tier
        texture.generateMipmaps = tier !== 'low';
        
        // Anisotropic filtering based on tier
        if (tier === 'high') {
          texture.anisotropy = 4;
        } else if (tier === 'medium') {
          texture.anisotropy = 2;
        } else {
          texture.anisotropy = 1;
        }

        // Cache the texture
        const sizeBytes = estimateTextureMemory(texture);
        textureCache.set(cacheKey, {
          data: texture,
          loadedAt: Date.now(),
          sizeBytes,
          refCount: 1,
        });
        textureCacheMemory += sizeBytes;

        resolve(texture);
      },
      undefined,
      (error) => {
        recordAssetLoadFailure();
        reject(error);
      }
    );
  });
}

/**
 * Release a texture reference.
 * Texture is disposed when refCount reaches 0 and cache pressure exists.
 */
export function releaseTexture(url: string, tier: QualityTier): void {
  const cacheKey = `${url}_${tier}`;
  const cached = textureCache.get(cacheKey);
  
  if (cached) {
    cached.refCount = Math.max(0, cached.refCount - 1);
  }
}

/**
 * Get texture cache statistics.
 */
export function getTextureCacheStats(): AssetCacheStats {
  return {
    count: textureCache.size,
    totalMemory: textureCacheMemory,
    hitRate: textureCacheRequests > 0 ? textureCacheHits / textureCacheRequests : 0,
  };
}

/**
 * Clear all cached textures.
 */
export function clearTextureCache(): void {
  textureCache.forEach((asset) => asset.data.dispose());
  textureCache.clear();
  textureCacheMemory = 0;
  textureCacheHits = 0;
  textureCacheRequests = 0;
}

// =============================================================================
// ENVIRONMENT MAP CACHE
// =============================================================================

/**
 * Cached environment maps.
 */
const envMapCache = new Map<string, CachedAsset<THREE.Texture>>();

/**
 * Available environment presets.
 * These are simple procedural environments for performance.
 */
const ENV_PRESETS = {
  city: { intensity: 1.0, tint: new THREE.Color(0.8, 0.85, 0.95) },
  sunset: { intensity: 0.8, tint: new THREE.Color(1.0, 0.9, 0.8) },
  studio: { intensity: 0.5, tint: new THREE.Color(0.95, 0.95, 1.0) },
  neutral: { intensity: 0.6, tint: new THREE.Color(0.9, 0.9, 0.9) },
} as const;

export type EnvPreset = keyof typeof ENV_PRESETS;

/**
 * Create a simple procedural environment map.
 * Much faster than loading HDR files.
 */
export function createProceduralEnvMap(
  preset: EnvPreset = 'studio',
  _tier: QualityTier = 'medium'
): THREE.Texture {
  const cacheKey = `env_${preset}`;
  
  if (envMapCache.has(cacheKey)) {
    const cached = envMapCache.get(cacheKey)!;
    cached.refCount++;
    return cached.data;
  }

  const { tint } = ENV_PRESETS[preset];
  
  // Create a simple gradient texture
  const size = 64; // Small for performance
  const data = new Float32Array(size * size * 4);
  
  for (let y = 0; y < size; y++) {
    const yFactor = y / size;
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      
      // Gradient from bottom to top
      const brightness = 0.3 + yFactor * 0.7;
      
      data[i] = tint.r * brightness;
      data[i + 1] = tint.g * brightness;
      data[i + 2] = tint.b * brightness;
      data[i + 3] = 1;
    }
  }

  const texture = new THREE.DataTexture(
    data,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;

  envMapCache.set(cacheKey, {
    data: texture,
    loadedAt: Date.now(),
    sizeBytes: size * size * 4 * 4, // Float32 = 4 bytes
    refCount: 1,
  });

  return texture;
}

/**
 * Clear environment map cache.
 */
export function clearEnvMapCache(): void {
  envMapCache.forEach((asset) => asset.data.dispose());
  envMapCache.clear();
}

// =============================================================================
// MATERIAL CACHE
// =============================================================================

/**
 * Material cache for reusing materials.
 */
const materialCache = new Map<string, CachedAsset<THREE.Material>>();

/**
 * Generate a cache key from material configuration.
 */
function getMaterialCacheKey(config: Record<string, unknown>): string {
  return JSON.stringify(config);
}

/**
 * Get or create a cached material.
 */
export function getCachedMaterial<T extends THREE.Material>(
  config: Record<string, unknown>,
  factory: () => T
): T {
  const key = getMaterialCacheKey(config);
  
  if (materialCache.has(key)) {
    const cached = materialCache.get(key)!;
    cached.refCount++;
    return cached.data as T;
  }

  const material = factory();
  materialCache.set(key, {
    data: material,
    loadedAt: Date.now(),
    sizeBytes: 1024, // Rough estimate for material
    refCount: 1,
  });

  return material;
}

/**
 * Release a material reference.
 */
export function releaseMaterial(config: Record<string, unknown>): void {
  const key = getMaterialCacheKey(config);
  const cached = materialCache.get(key);
  
  if (cached) {
    cached.refCount = Math.max(0, cached.refCount - 1);
    
    // Dispose if no references and cache is large
    if (cached.refCount === 0 && materialCache.size > 50) {
      cached.data.dispose();
      materialCache.delete(key);
    }
  }
}

/**
 * Clear all cached materials.
 */
export function clearMaterialCache(): void {
  materialCache.forEach((asset) => asset.data.dispose());
  materialCache.clear();
}

// =============================================================================
// CLEANUP UTILITIES
// =============================================================================

/**
 * Clear all asset caches.
 */
export function clearAllCaches(): void {
  clearTextureCache();
  clearEnvMapCache();
  clearMaterialCache();
}

/**
 * Get combined cache statistics.
 */
export function getAllCacheStats(): {
  textures: AssetCacheStats;
  materials: { count: number };
  envMaps: { count: number };
} {
  return {
    textures: getTextureCacheStats(),
    materials: { count: materialCache.size },
    envMaps: { count: envMapCache.size },
  };
}
