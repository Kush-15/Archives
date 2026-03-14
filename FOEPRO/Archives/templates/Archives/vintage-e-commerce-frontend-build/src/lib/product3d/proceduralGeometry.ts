/**
 * Procedural Geometry Generators
 * 
 * Skill-guided procedural 3D geometry for vintage product rendering.
 * Follows threejs-geometry skill guidelines:
 * - Use indexed geometry for vertex reuse
 * - Tier-appropriate segment counts
 * - Proper normal computation
 * - Geometry disposal patterns
 * 
 * Priority: Performance-first for low-RAM/integrated-GPU hardware
 * Baseline: 8GB RAM laptop with integrated graphics
 */

import * as THREE from 'three';
import type {
  QualityTier,
  ProceduralGeometryConfig,
  ProceduralFeature,
} from './types';
import { GEOMETRY_PROFILES } from './registry';

// =============================================================================
// GEOMETRY CACHE
// =============================================================================

/**
 * Cache for reusing geometry instances.
 * Key format: `${baseShape}_${tier}_${dimensionsHash}`
 */
const geometryCache = new Map<string, THREE.BufferGeometry>();
const MAX_CACHE_SIZE = 50;

/**
 * Generate a cache key for geometry configuration.
 */
function getCacheKey(config: ProceduralGeometryConfig, tier: QualityTier): string {
  const dimHash = config.dimensions.join('x');
  const segHash = config.segments[tier].join('x');
  return `${config.baseShape}_${tier}_${dimHash}_${segHash}`;
}

/**
 * Clear the geometry cache and dispose all geometries.
 */
export function clearGeometryCache(): void {
  geometryCache.forEach((geo) => geo.dispose());
  geometryCache.clear();
}

/**
 * Get cache statistics.
 */
export function getGeometryCacheStats(): { size: number; maxSize: number } {
  return { size: geometryCache.size, maxSize: MAX_CACHE_SIZE };
}

// =============================================================================
// BASE GEOMETRY GENERATORS
// =============================================================================

/**
 * Create a box geometry with tier-appropriate segments.
 */
function createBoxGeometry(
  dimensions: readonly number[] | number[],
  segments: readonly number[] | number[]
): THREE.BoxGeometry {
  const [width, height, depth] = dimensions;
  const [wSegs, hSegs, dSegs] = segments;
  return new THREE.BoxGeometry(width, height, depth, wSegs, hSegs, dSegs);
}

/**
 * Create a cylinder geometry with tier-appropriate segments.
 */
function createCylinderGeometry(
  dimensions: readonly number[] | number[],
  segments: readonly number[] | number[]
): THREE.CylinderGeometry {
  const [radius, height] = dimensions;
  const [radialSegs, heightSegs] = segments;
  return new THREE.CylinderGeometry(radius, radius, height, radialSegs, heightSegs);
}

/**
 * Create a sphere geometry with tier-appropriate segments.
 */
function createSphereGeometry(
  dimensions: readonly number[] | number[],
  segments: readonly number[] | number[]
): THREE.SphereGeometry {
  const [radius] = dimensions;
  const [widthSegs, heightSegs] = segments;
  return new THREE.SphereGeometry(radius, widthSegs, heightSegs);
}

/**
 * Create base geometry from configuration.
 */
function createBaseGeometry(
  config: ProceduralGeometryConfig,
  tier: QualityTier
): THREE.BufferGeometry {
  const segments = config.segments[tier];

  switch (config.baseShape) {
    case 'box':
      return createBoxGeometry(config.dimensions, segments);
    case 'cylinder':
      return createCylinderGeometry(config.dimensions, segments);
    case 'sphere':
      return createSphereGeometry(config.dimensions, segments);
    case 'custom':
    default:
      // Default to box for custom shapes
      return createBoxGeometry(config.dimensions, segments);
  }
}

// =============================================================================
// FEATURE GEOMETRY GENERATORS
// =============================================================================

/**
 * Create geometry for a button feature.
 */
function createButtonGeometry(
  scale: [number, number, number],
  tier: QualityTier
): THREE.BufferGeometry {
  const segs = tier === 'low' ? 4 : tier === 'medium' ? 8 : 16;
  return new THREE.CylinderGeometry(
    scale[0] / 2,
    scale[0] / 2,
    scale[2],
    segs,
    1
  );
}

/**
 * Create geometry for a dial/knob feature.
 */
function createDialGeometry(
  scale: [number, number, number],
  tier: QualityTier
): THREE.BufferGeometry {
  const segs = tier === 'low' ? 6 : tier === 'medium' ? 12 : 24;
  const geo = new THREE.CylinderGeometry(
    scale[0] / 2,
    scale[0] / 2,
    scale[2],
    segs,
    1
  );
  // Rotate to face forward
  geo.rotateX(Math.PI / 2);
  return geo;
}

/**
 * Create geometry for a screen/display feature.
 */
function createScreenGeometry(
  scale: [number, number, number],
  tier: QualityTier
): THREE.BufferGeometry {
  const segs = tier === 'low' ? 1 : 2;
  return new THREE.BoxGeometry(scale[0], scale[1], scale[2], segs, segs, 1);
}

/**
 * Create geometry for a slot (cassette, cartridge, etc.).
 */
function createSlotGeometry(
  scale: [number, number, number],
  _tier: QualityTier
): THREE.BufferGeometry {
  // Slots are always low-poly
  return new THREE.BoxGeometry(scale[0], scale[1], scale[2], 1, 1, 1);
}

/**
 * Create geometry for a port (headphone jack, etc.).
 */
function createPortGeometry(
  scale: [number, number, number],
  tier: QualityTier
): THREE.BufferGeometry {
  const segs = tier === 'low' ? 6 : tier === 'medium' ? 12 : 16;
  const geo = new THREE.CylinderGeometry(
    scale[0] / 2,
    scale[0] / 2,
    scale[2],
    segs,
    1
  );
  geo.rotateX(Math.PI / 2);
  return geo;
}

/**
 * Create geometry for a lens feature.
 */
function createLensGeometry(
  scale: [number, number, number],
  tier: QualityTier
): THREE.BufferGeometry {
  const segs = tier === 'low' ? 8 : tier === 'medium' ? 16 : 32;
  
  // Lens is a cylinder with rounded front
  const cylinder = new THREE.CylinderGeometry(
    scale[0] / 2,
    scale[0] / 2,
    scale[2] * 0.8,
    segs,
    1
  );
  cylinder.rotateX(Math.PI / 2);
  cylinder.translate(0, 0, scale[2] * 0.4);

  // Add sphere cap for lens glass
  const sphere = new THREE.SphereGeometry(
    scale[0] / 2,
    segs,
    segs / 2,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  sphere.rotateX(-Math.PI / 2);
  sphere.translate(0, 0, scale[2] * 0.8);

  // Merge geometries
  const mergedGeo = mergeBufferGeometries([cylinder, sphere]);
  if (mergedGeo) {
    return mergedGeo;
  }
  return cylinder;
}

/**
 * Create geometry for a speaker grille.
 */
function createSpeakerGeometry(
  scale: [number, number, number],
  tier: QualityTier
): THREE.BufferGeometry {
  const segs = tier === 'low' ? 1 : 2;
  return new THREE.BoxGeometry(scale[0], scale[1], scale[2], segs, segs, 1);
}

/**
 * Create geometry for an antenna feature.
 */
function createAntennaGeometry(
  scale: [number, number, number],
  tier: QualityTier
): THREE.BufferGeometry {
  const segs = tier === 'low' ? 4 : 8;
  return new THREE.CylinderGeometry(
    scale[0] / 4,
    scale[0] / 2,
    scale[1],
    segs,
    1
  );
}

/**
 * Create geometry for a generic custom feature.
 */
function createCustomFeatureGeometry(
  scale: [number, number, number],
  _tier: QualityTier
): THREE.BufferGeometry {
  return new THREE.BoxGeometry(scale[0], scale[1], scale[2], 1, 1, 1);
}

/**
 * Create geometry for a feature based on its type.
 */
function createFeatureGeometry(
  feature: ProceduralFeature,
  tier: QualityTier
): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry;

  switch (feature.type) {
    case 'button':
      geo = createButtonGeometry(feature.scale, tier);
      break;
    case 'dial':
      geo = createDialGeometry(feature.scale, tier);
      break;
    case 'screen':
      geo = createScreenGeometry(feature.scale, tier);
      break;
    case 'slot':
      geo = createSlotGeometry(feature.scale, tier);
      break;
    case 'port':
      geo = createPortGeometry(feature.scale, tier);
      break;
    case 'lens':
      geo = createLensGeometry(feature.scale, tier);
      break;
    case 'speaker':
      geo = createSpeakerGeometry(feature.scale, tier);
      break;
    case 'antenna':
      geo = createAntennaGeometry(feature.scale, tier);
      break;
    case 'custom':
    default:
      geo = createCustomFeatureGeometry(feature.scale, tier);
      break;
  }

  // Apply position
  geo.translate(feature.position[0], feature.position[1], feature.position[2]);

  // Apply rotation if specified
  if (feature.rotation) {
    geo.rotateX(feature.rotation[0]);
    geo.rotateY(feature.rotation[1]);
    geo.rotateZ(feature.rotation[2]);
  }

  return geo;
}

// =============================================================================
// GEOMETRY MERGE UTILITY
// =============================================================================

/**
 * Simple merge for BufferGeometries with same attributes.
 * Lightweight alternative to BufferGeometryUtils for our use case.
 */
function mergeBufferGeometries(
  geometries: THREE.BufferGeometry[]
): THREE.BufferGeometry | null {
  if (geometries.length === 0) return null;
  if (geometries.length === 1) return geometries[0].clone();

  // Count total vertices and indices
  let totalVertices = 0;
  let totalIndices = 0;

  for (const geo of geometries) {
    const positions = geo.getAttribute('position');
    if (positions) {
      totalVertices += positions.count;
    }
    const index = geo.getIndex();
    if (index) {
      totalIndices += index.count;
    } else if (positions) {
      totalIndices += positions.count;
    }
  }

  // Create merged arrays
  const positions = new Float32Array(totalVertices * 3);
  const normals = new Float32Array(totalVertices * 3);
  const uvs = new Float32Array(totalVertices * 2);
  const indices: number[] = [];

  let vertexOffset = 0;
  let indexOffset = 0;

  for (const geo of geometries) {
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const normalAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
    const uvAttr = geo.getAttribute('uv') as THREE.BufferAttribute;
    const indexAttr = geo.getIndex();

    if (posAttr) {
      positions.set(posAttr.array as Float32Array, vertexOffset * 3);
    }
    if (normalAttr) {
      normals.set(normalAttr.array as Float32Array, vertexOffset * 3);
    }
    if (uvAttr) {
      uvs.set(uvAttr.array as Float32Array, vertexOffset * 2);
    }

    if (indexAttr) {
      for (let i = 0; i < indexAttr.count; i++) {
        indices.push(indexAttr.getX(i) + vertexOffset);
      }
    } else if (posAttr) {
      for (let i = 0; i < posAttr.count; i++) {
        indices.push(i + vertexOffset);
      }
    }

    if (posAttr) {
      vertexOffset += posAttr.count;
    }
    indexOffset += indexAttr ? indexAttr.count : (posAttr?.count ?? 0);
  }

  // Create merged geometry
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(indices);

  return merged;
}

// =============================================================================
// MAIN GENERATOR
// =============================================================================

/**
 * Generate procedural product geometry from configuration.
 * 
 * @param config - Procedural geometry configuration
 * @param tier - Quality tier for segment counts
 * @param useCache - Whether to use/update geometry cache (default: true)
 * @returns The generated BufferGeometry
 */
export function generateProductGeometry(
  config: ProceduralGeometryConfig,
  tier: QualityTier,
  useCache = true
): THREE.BufferGeometry {
  const cacheKey = getCacheKey(config, tier);

  // Check cache
  if (useCache && geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey)!.clone();
  }

  // Generate base geometry
  const baseGeometry = createBaseGeometry(config, tier);

  // Generate feature geometries (only for medium and high tiers)
  const featureGeometries: THREE.BufferGeometry[] = [];
  if (config.features && tier !== 'low') {
    // For low tier, skip features to save triangles
    const maxFeatures = tier === 'medium' ? 5 : config.features.length;
    const features = config.features.slice(0, maxFeatures);

    for (const feature of features) {
      featureGeometries.push(createFeatureGeometry(feature, tier));
    }
  }

  // Merge all geometries
  let finalGeometry: THREE.BufferGeometry;
  if (featureGeometries.length > 0) {
    const allGeometries = [baseGeometry, ...featureGeometries];
    const merged = mergeBufferGeometries(allGeometries);
    finalGeometry = merged ?? baseGeometry;

    // Dispose intermediate geometries
    for (const geo of allGeometries) {
      geo.dispose();
    }
  } else {
    finalGeometry = baseGeometry;
  }

  // Ensure normals are computed
  finalGeometry.computeVertexNormals();
  finalGeometry.computeBoundingBox();
  finalGeometry.computeBoundingSphere();

  // Update cache
  if (useCache) {
    // Evict oldest entries if cache is full
    if (geometryCache.size >= MAX_CACHE_SIZE) {
      const firstKey = geometryCache.keys().next().value;
      if (firstKey) {
        const oldGeo = geometryCache.get(firstKey);
        oldGeo?.dispose();
        geometryCache.delete(firstKey);
      }
    }
    geometryCache.set(cacheKey, finalGeometry.clone());
  }

  return finalGeometry;
}

// =============================================================================
// FALLBACK SILHOUETTE GENERATOR
// =============================================================================

/**
 * Generate a minimal fallback silhouette geometry.
 * Used when product slug is unknown or assets fail to load.
 * Extremely lightweight: 12 triangles max.
 */
export function generateFallbackGeometry(): THREE.BufferGeometry {
  const cacheKey = 'fallback';
  
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey)!.clone();
  }

  // Simple box silhouette
  const geo = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();

  geometryCache.set(cacheKey, geo.clone());
  return geo;
}

// =============================================================================
// PRODUCT FAMILY GENERATORS
// =============================================================================

/**
 * Generate geometry for audio portable products (Walkman, etc.).
 */
export function generateAudioPortableGeometry(tier: QualityTier): THREE.BufferGeometry {
  return generateProductGeometry(GEOMETRY_PROFILES.audioPortable as ProceduralGeometryConfig, tier);
}

/**
 * Generate geometry for audio receiver products (radio, etc.).
 */
export function generateAudioReceiverGeometry(tier: QualityTier): THREE.BufferGeometry {
  return generateProductGeometry(GEOMETRY_PROFILES.audioReceiver as ProceduralGeometryConfig, tier);
}

/**
 * Generate geometry for turntable products.
 */
export function generateTurntableGeometry(tier: QualityTier): THREE.BufferGeometry {
  return generateProductGeometry(GEOMETRY_PROFILES.turntable as ProceduralGeometryConfig, tier);
}

/**
 * Generate geometry for rangefinder cameras.
 */
export function generateCameraRangefinderGeometry(tier: QualityTier): THREE.BufferGeometry {
  return generateProductGeometry(GEOMETRY_PROFILES.cameraRangefinder as ProceduralGeometryConfig, tier);
}

/**
 * Generate geometry for medium format cameras.
 */
export function generateCameraMediumFormatGeometry(tier: QualityTier): THREE.BufferGeometry {
  return generateProductGeometry(GEOMETRY_PROFILES.cameraMediumFormat as ProceduralGeometryConfig, tier);
}

/**
 * Generate geometry for folding cameras.
 */
export function generateCameraFoldingGeometry(tier: QualityTier): THREE.BufferGeometry {
  return generateProductGeometry(GEOMETRY_PROFILES.cameraFolding as ProceduralGeometryConfig, tier);
}

/**
 * Generate geometry for computer products.
 */
export function generateComputerGeometry(tier: QualityTier): THREE.BufferGeometry {
  return generateProductGeometry(GEOMETRY_PROFILES.computer as ProceduralGeometryConfig, tier);
}

/**
 * Generate geometry for keyboard products.
 */
export function generateKeyboardGeometry(tier: QualityTier): THREE.BufferGeometry {
  return generateProductGeometry(GEOMETRY_PROFILES.keyboard as ProceduralGeometryConfig, tier);
}

/**
 * Generate geometry for gaming console products.
 */
export function generateConsoleGeometry(tier: QualityTier): THREE.BufferGeometry {
  return generateProductGeometry(GEOMETRY_PROFILES.console as ProceduralGeometryConfig, tier);
}

/**
 * Generate geometry for television products.
 */
export function generateTelevisionGeometry(tier: QualityTier): THREE.BufferGeometry {
  return generateProductGeometry(GEOMETRY_PROFILES.television as ProceduralGeometryConfig, tier);
}

// =============================================================================
// MULTI-MESH GENERATOR (separate geometry per feature for multi-material)
// =============================================================================

/**
 * Result of generating separate geometries for multi-material rendering.
 */
export interface SeparateGeometryResult {
  base: THREE.BufferGeometry;
  features: {
    geometry: THREE.BufferGeometry;
    type: string;
    position: [number, number, number];
    rotation?: [number, number, number];
  }[];
}

/**
 * Generate separate geometries for base shape and each feature.
 * Unlike generateProductGeometry, this does NOT merge — each feature
 * returns as its own geometry so different materials can be assigned.
 */
export function generateSeparateGeometries(
  config: ProceduralGeometryConfig,
  tier: QualityTier
): SeparateGeometryResult {
  // Generate base geometry
  const base = createBaseGeometry(config, tier);
  base.computeVertexNormals();
  base.computeBoundingBox();

  const features: SeparateGeometryResult['features'] = [];

  if (config.features && tier !== 'low') {
    const maxFeatures = tier === 'medium' ? 5 : config.features.length;
    const feats = config.features.slice(0, maxFeatures);

    for (const feature of feats) {
      // Create geometry WITHOUT translating — we'll position via JSX
      let geo: THREE.BufferGeometry;
      switch (feature.type) {
        case 'button':
          geo = createButtonGeometry(feature.scale, tier);
          break;
        case 'dial':
          geo = createDialGeometry(feature.scale, tier);
          break;
        case 'screen':
          geo = createScreenGeometry(feature.scale, tier);
          break;
        case 'slot':
          geo = createSlotGeometry(feature.scale, tier);
          break;
        case 'port':
          geo = createPortGeometry(feature.scale, tier);
          break;
        case 'lens':
          geo = createLensGeometry(feature.scale, tier);
          break;
        case 'speaker':
          geo = createSpeakerGeometry(feature.scale, tier);
          break;
        case 'antenna':
          geo = createAntennaGeometry(feature.scale, tier);
          break;
        case 'custom':
        default:
          geo = createCustomFeatureGeometry(feature.scale, tier);
          break;
      }

      geo.computeVertexNormals();

      features.push({
        geometry: geo,
        type: feature.type,
        position: feature.position,
        rotation: feature.rotation,
      });
    }
  }

  return { base, features };
}

// =============================================================================
// TRIANGLE COUNT ESTIMATION
// =============================================================================

/**
 * Estimate triangle count for a procedural geometry configuration.
 * Used for budget validation before generation.
 */
export function estimateTriangleCount(
  config: ProceduralGeometryConfig,
  tier: QualityTier
): number {
  const segments = config.segments[tier];
  let triangles = 0;

  // Base shape estimation
  switch (config.baseShape) {
    case 'box':
      // Box: 2 triangles per face, 6 faces, multiplied by segments
      const [wS, hS, dS] = segments;
      triangles += 2 * (wS * hS * 2 + wS * dS * 2 + hS * dS * 2);
      break;
    case 'cylinder':
      // Cylinder: radialSegs * 2 (caps) + radialSegs * 2 (sides) * heightSegs
      const [rS, heightS] = segments;
      triangles += rS * 2 + rS * 2 * heightS;
      break;
    case 'sphere':
      // Sphere: roughly widthSegs * heightSegs * 2
      const [widthS, heightSph] = segments;
      triangles += widthS * heightSph * 2;
      break;
    default:
      // Default to box estimation
      triangles += 12 * segments[0];
  }

  // Feature estimation (only for non-low tiers)
  if (config.features && tier !== 'low') {
    const maxFeatures = tier === 'medium' ? 5 : config.features.length;
    const featureCount = Math.min(config.features.length, maxFeatures);
    // Estimate ~20-50 triangles per feature depending on tier
    const triPerFeature = tier === 'medium' ? 20 : 40;
    triangles += featureCount * triPerFeature;
  }

  return triangles;
}
