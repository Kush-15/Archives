import * as THREE from 'three';

export interface MeshZone {
  zone: 'body' | 'topPlate' | 'lensBarrel' | 'lensGlass';
  mesh: THREE.Mesh;
  confidence: number; // 0-1, how confident the detection is
}

/**
 * ZONE DETECTION STRATEGY (Order of priority):
 * 1. Geometry type detection (cylinder = lens barrel, sphere = lens glass)
 * 2. Position-based (top 20% = controls, front-facing = lens)
 * 3. Size-based (<5% volume = details, >40% = body)
 * 4. Fallback to body (largest mesh)
 * 
 * Returns zones with confidence scores for debugging
 */
export function detectMaterialZones(
  group: THREE.Group,
  debugMode = false
): MeshZone[] {
  const zones: MeshZone[] = [];
  const meshes: THREE.Mesh[] = [];
  
  // Collect all meshes
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) meshes.push(child);
  });

  if (meshes.length === 0) {
    console.warn('[materialZoneDetection] No meshes found in group');
    return [];
  }

  // Calculate model bounds
  const modelBox = new THREE.Box3().setFromObject(group);
  const modelHeight = modelBox.max.y - modelBox.min.y;
  const modelVolume =
    (modelBox.max.x - modelBox.min.x) *
    modelHeight *
    (modelBox.max.z - modelBox.min.z);

  let largestVolume = 0;

  // Process each mesh
  meshes.forEach((mesh) => {
    const bbox = new THREE.Box3().setFromObject(mesh);
    const meshVolume =
      (bbox.max.x - bbox.min.x) *
      (bbox.max.y - bbox.min.y) *
      (bbox.max.z - bbox.min.z);

    // Track largest (likely body)
    if (meshVolume > largestVolume) {
      largestVolume = meshVolume;
    }

    let zone: 'body' | 'topPlate' | 'lensBarrel' | 'lensGlass';
    let confidence = 0;

    // RULE 1: Geometry type (highest confidence)
    if (mesh.geometry instanceof THREE.CylinderGeometry) {
      // Cylindrical + front-facing = lens barrel
      if (bbox.max.z > modelBox.max.z * 0.6) {
        zone = 'lensBarrel';
        confidence = 0.95;
      } else {
        zone = 'topPlate'; // Side cylinder = detail
        confidence = 0.7;
      }
    } else if (mesh.geometry instanceof THREE.SphereGeometry) {
      // Spherical + small = lens glass element
      if (meshVolume < modelVolume * 0.02) {
        zone = 'lensGlass';
        confidence = 0.9;
      } else {
        zone = 'body';
        confidence = 0.5;
      }
    }
    // RULE 2: Position-based (high confidence)
    else if (bbox.min.y > modelBox.min.y + modelHeight * 0.8) {
      // Top 20% = controls/top plate
      zone = 'topPlate';
      confidence = 0.85;
    }
    // RULE 3: Size-based (medium confidence)
    else if (meshVolume < modelVolume * 0.05 && meshVolume > modelVolume * 0.005) {
      // 0.5-5% of volume = knobs/details
      zone = 'topPlate';
      confidence = 0.7;
    } else if (meshVolume < modelVolume * 0.005) {
      // <0.5% = tiny details, treat as chrome
      zone = 'topPlate';
      confidence = 0.6;
    }
    // RULE 4: Fallback
    else {
      zone = 'body';
      confidence = 0.5;
    }

    zones.push({ zone, mesh, confidence });

    // DEBUG OUTPUT (if enabled)
    if (debugMode) {
      console.log(
        `[Mesh] geom=${mesh.geometry.constructor.name}, ` +
        `volume=${(meshVolume / modelVolume * 100).toFixed(1)}%, ` +
        `zone=${zone}, ` +
        `conf=${(confidence * 100).toFixed(0)}%`
      );
    }
  });

  if (debugMode) {
    console.log(
      `[materialZoneDetection] Processed ${meshes.length} meshes, ` +
      `body=${zones.filter((z) => z.zone === 'body').length}, ` +
      `chrome=${zones.filter((z) => z.zone === 'topPlate').length}, ` +
      `lens=${zones.filter((z) => z.zone === 'lensBarrel' || z.zone === 'lensGlass').length}`
    );
  }

  return zones;
}

/**
 * MANUAL OVERRIDES
 * For cameras where heuristics fail, manually specify zones
 */
export const manualZoneOverrides: Record<
  string,
  { meshIndex: number; zone: 'body' | 'topPlate' | 'lensBarrel' | 'lensGlass' }[]
> = {
  // Example: 'Leica M3': [{ meshIndex: 0, zone: 'body' }, { meshIndex: 1, zone: 'topPlate' }]
  // Add overrides here if needed after testing
};

/**
 * Apply manual overrides to detected zones
 */
export function applyManualOverrides(
  zones: MeshZone[],
  cameraName: string
): MeshZone[] {
  const overrides = manualZoneOverrides[cameraName];
  if (!overrides) return zones;

  overrides.forEach((override) => {
    if (zones[override.meshIndex]) {
      zones[override.meshIndex].zone = override.zone;
    }
  });

  return zones;
}
