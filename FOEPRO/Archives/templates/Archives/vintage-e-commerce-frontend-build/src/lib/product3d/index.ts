/**
 * Product 3D Module
 * 
 * Slug-driven Three.js product renderer system for vintage e-commerce.
 * 
 * Usage:
 * ```tsx
 * import { Product3DRenderer } from '@/lib/product3d';
 * 
 * <Product3DRenderer slug="sony-walkman-tps-l2" />
 * ```
 * 
 * @module product3d
 */

// Main component
export { Product3DRenderer, default } from './Product3DRenderer';

// Types
export type {
  QualityTier,
  DeviceCapabilities,
  PerformanceBudget,
  ProductCategory,
  ProductSlug,
  ProductAssets,
  ProceduralGeometryConfig,
  ProceduralFeature,
  MaterialConfig,
  LightingConfig,
  AnimationConfig,
  CameraConfig,
  ProductRendererConfig,
  RegistryLookupResult,
  Product3DRendererProps,
  Product3DContext,
  AnimationSettings,
  AssetLoadStatus,
  CachedAsset,
  AssetCacheStats,
} from './types';

// Registry
export {
  lookupProduct,
  getRegisteredSlugs,
  isSlugRegistered,
  getFallbackConfig,
  getProductsByCategory,
  GEOMETRY_PROFILES,
  MATERIAL_PROFILES,
  LIGHTING_PROFILES,
  ANIMATION_PROFILES,
  CAMERA_PROFILES,
} from './registry';

// Tier detection
export {
  detectQualityTier,
  detectCapabilities,
  getDeviceProfile,
  getAnimationSettings,
  prefersReducedMotion,
  forceReducedMotion,
  forceQualityTier,
  clearDetectionCache,
  canHandleTier,
  // Performance monitoring
  recordFrameTime,
  getAverageFrameTime,
  shouldDowngradeTier,
  suggestTierFromPerformance,
  // Telemetry
  recordFallbackRender,
  recordAssetLoadFailure,
  recordTierDowngrade,
  recordRender,
  recordFrame,
  getTelemetry,
  getTelemetrySummary,
  resetTelemetry,
} from './tierDetection';

// Constants
export {
  LOW_TIER_BUDGET,
  MEDIUM_TIER_BUDGET,
  HIGH_TIER_BUDGET,
  getPerformanceBudget,
} from './constants';

// Procedural geometry
export {
  generateProductGeometry,
  generateFallbackGeometry,
  estimateTriangleCount,
  clearGeometryCache,
  getGeometryCacheStats,
  // Family generators
  generateAudioPortableGeometry,
  generateAudioReceiverGeometry,
  generateTurntableGeometry,
  generateCameraRangefinderGeometry,
  generateCameraMediumFormatGeometry,
  generateCameraFoldingGeometry,
  generateComputerGeometry,
  generateKeyboardGeometry,
  generateConsoleGeometry,
  generateTelevisionGeometry,
} from './proceduralGeometry';

// Asset loading
export {
  loadTexture,
  releaseTexture,
  getTextureCacheStats,
  clearTextureCache,
  createProceduralEnvMap,
  clearEnvMapCache,
  getCachedMaterial,
  releaseMaterial,
  clearMaterialCache,
  clearAllCaches,
  getAllCacheStats,
  onLoadProgress,
  onLoadError,
  getLoadingState,
  type EnvPreset,
} from './assetLoading';
