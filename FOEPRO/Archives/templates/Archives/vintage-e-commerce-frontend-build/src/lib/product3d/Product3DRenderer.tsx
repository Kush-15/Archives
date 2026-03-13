/**
 * Product3DRenderer Component
 * 
 * Slug-driven Three.js product renderer with automatic tier detection.
 * Follows skill guidelines for performance-first rendering.
 * 
 * Features:
 * - Automatic device capability detection and tier assignment
 * - Procedural geometry generation for all product families
 * - Reduced motion support (respects prefers-reduced-motion)
 * - Runtime telemetry for monitoring
 * - Graceful fallback for unknown slugs
 * 
 * Priority: Performance-first for low-RAM/integrated-GPU hardware
 * Baseline: 8GB RAM laptop with integrated graphics
 */

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { Product3DRendererProps, QualityTier, ProductRendererConfig } from './types';
import { lookupProduct } from './registry';
import { 
  detectQualityTier, 
  getAnimationSettings, 
  prefersReducedMotion,
  recordRender,
  recordFallbackRender,
  recordFrame,
} from './tierDetection';
import { getPerformanceBudget } from './constants';
import { generateProductGeometry, generateFallbackGeometry } from './proceduralGeometry';
import { useInViewCanvas } from '@/hooks/useInViewCanvas';

// =============================================================================
// INTERNAL COMPONENTS
// =============================================================================

/**
 * Material factory based on registry config.
 */
function createMaterial(
  config: ProductRendererConfig,
  tier: QualityTier
): THREE.Material {
  const matConfig = config.material;
  
  // Use simpler material for low tier
  if (tier === 'low' && matConfig.type !== 'lambert') {
    return new THREE.MeshLambertMaterial({
      color: matConfig.color,
      transparent: matConfig.transparent,
      opacity: matConfig.opacity,
    });
  }

  switch (matConfig.type) {
    case 'physical':
      return new THREE.MeshPhysicalMaterial({
        color: matConfig.color,
        metalness: matConfig.metalness ?? 0,
        roughness: matConfig.roughness ?? 0.5,
        envMapIntensity: matConfig.envMapIntensity ?? 1,
        transparent: matConfig.transparent,
        opacity: matConfig.opacity,
      });
    case 'basic':
      return new THREE.MeshBasicMaterial({
        color: matConfig.color,
        transparent: matConfig.transparent,
        opacity: matConfig.opacity,
      });
    case 'lambert':
      return new THREE.MeshLambertMaterial({
        color: matConfig.color,
        transparent: matConfig.transparent,
        opacity: matConfig.opacity,
      });
    case 'standard':
    default:
      return new THREE.MeshStandardMaterial({
        color: matConfig.color,
        metalness: matConfig.metalness ?? 0,
        roughness: matConfig.roughness ?? 0.5,
        envMapIntensity: tier === 'low' ? 0.3 : (matConfig.envMapIntensity ?? 0.8),
        transparent: matConfig.transparent,
        opacity: matConfig.opacity,
      });
  }
}

/**
 * Product mesh component with animations.
 */
interface ProductMeshProps {
  config: ProductRendererConfig;
  tier: QualityTier;
  interactive?: boolean;
  autoRotate?: boolean;
}

function ProductMesh({ config, tier, interactive, autoRotate }: ProductMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { invalidate } = useThree();
  
  const animationSettings = useMemo(() => getAnimationSettings(tier), [tier]);
  
  // Generate geometry
  const geometry = useMemo(() => {
    if (!config.procedural || !config.proceduralConfig) {
      return generateFallbackGeometry();
    }
    return generateProductGeometry(config.proceduralConfig, tier);
  }, [config, tier]);

  // Create material
  const material = useMemo(() => createMaterial(config, tier), [config, tier]);

  // Cleanup
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Animation frame
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const group = groupRef.current;
    const shouldAnimate = autoRotate !== false && animationSettings.idleRotation;
    
    // Idle rotation
    if (shouldAnimate && config.animation?.idleRotation?.enabled) {
      const speed = config.animation.idleRotation.speed * animationSettings.speedMultiplier;
      group.rotation.y += speed * delta;
    }

    // Floating animation (only for medium/high tiers)
    if (tier !== 'low' && animationSettings.enabled) {
      group.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.03;
    }

    // Hover scale
    if (animationSettings.hoverEffects && config.animation?.hoverEffect?.enabled) {
      const targetScale = hovered ? (config.animation.hoverEffect.scale ?? 1.02) : 1;
      group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    // Record frame for telemetry
    recordFrame(delta * 1000);
    
    // Demand invalidation
    invalidate();
  });

  const handlePointerOver = useCallback(() => {
    if (interactive !== false && animationSettings.hoverEffects) {
      setHovered(true);
    }
  }, [interactive, animationSettings.hoverEffects]);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
  }, []);

  return (
    <group
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

/**
 * Lighting setup based on config and tier.
 */
interface LightingSetupProps {
  config: ProductRendererConfig;
  tier: QualityTier;
}

function LightingSetup({ config, tier }: LightingSetupProps) {
  const lighting = config.lighting;
  const budget = getPerformanceBudget(tier);

  return (
    <>
      {/* Ambient light - always present */}
      <ambientLight 
        intensity={lighting.ambientIntensity} 
        color={lighting.ambientColor} 
      />
      
      {/* Key light */}
      {lighting.keyLight && (
        <directionalLight
          position={lighting.keyLight.position}
          intensity={lighting.keyLight.intensity}
          color={lighting.keyLight.color}
          castShadow={budget.enableShadows && lighting.keyLight.castShadow}
          shadow-mapSize-width={budget.shadowMapSize}
          shadow-mapSize-height={budget.shadowMapSize}
        />
      )}
      
      {/* Fill light - medium/high tier only */}
      {tier !== 'low' && lighting.fillLight && (
        <pointLight
          position={lighting.fillLight.position}
          intensity={lighting.fillLight.intensity}
          color={lighting.fillLight.color}
        />
      )}
      
      {/* Rim light - high tier only */}
      {tier === 'high' && lighting.rimLight && (
        <pointLight
          position={lighting.rimLight.position}
          intensity={lighting.rimLight.intensity}
          color={lighting.rimLight.color}
        />
      )}
    </>
  );
}

/**
 * Environment setup based on config and tier.
 */
interface EnvironmentSetupProps {
  config: ProductRendererConfig;
  tier: QualityTier;
}

function EnvironmentSetup({ config, tier }: EnvironmentSetupProps) {
  const lighting = config.lighting;

  // Skip environment for low tier
  if (tier === 'low' || !lighting.useEnvironment) {
    return null;
  }

  // Use drei Environment for medium/high tiers
  const preset = (lighting.environment as 'city' | 'sunset' | 'studio') || 'city';
  
  return (
    <>
      <Environment preset={preset} background={false} />
      {tier === 'high' && (
        <ContactShadows
          position={[0, -0.8, 0]}
          opacity={0.4}
          scale={5}
          blur={2.5}
        />
      )}
    </>
  );
}

/**
 * Camera controls setup.
 */
interface ControlsSetupProps {
  config: ProductRendererConfig;
  tier: QualityTier;
  interactive?: boolean;
  autoRotate?: boolean;
}

function ControlsSetup({ config, tier, interactive, autoRotate }: ControlsSetupProps) {
  const camera = config.camera;
  const controls = camera.controls;
  const animationSettings = getAnimationSettings(tier);

  if (!controls?.enabled || interactive === false) {
    return null;
  }

  return (
    <OrbitControls
      enableZoom={controls.enableZoom ?? false}
      enablePan={controls.enablePan ?? false}
      minDistance={controls.minDistance}
      maxDistance={controls.maxDistance}
      minPolarAngle={controls.minPolarAngle}
      maxPolarAngle={controls.maxPolarAngle}
      autoRotate={autoRotate ?? (animationSettings.autoRotate && controls.autoRotate)}
      autoRotateSpeed={(controls.autoRotateSpeed ?? 1) * animationSettings.speedMultiplier}
      enableDamping
      dampingFactor={controls.dampingFactor ?? 0.05}
    />
  );
}

/**
 * Internal scene component.
 */
interface ProductSceneProps {
  slug: string;
  tier: QualityTier;
  interactive?: boolean;
  autoRotate?: boolean;
  onLoad?: () => void;
}

function ProductScene({ slug, tier, interactive, autoRotate, onLoad }: ProductSceneProps) {
  const lookup = useMemo(() => lookupProduct(slug, tier), [slug, tier]);
  
  useEffect(() => {
    // Record telemetry
    recordRender(tier);
    if (lookup.isFallback) {
      recordFallbackRender();
    }
    
    // Notify load complete
    onLoad?.();
  }, [lookup, tier, onLoad]);

  return (
    <>
      <ProductMesh 
        config={lookup.config} 
        tier={tier} 
        interactive={interactive}
        autoRotate={autoRotate}
      />
      <LightingSetup config={lookup.config} tier={tier} />
      <EnvironmentSetup config={lookup.config} tier={tier} />
      <ControlsSetup 
        config={lookup.config} 
        tier={tier} 
        interactive={interactive}
        autoRotate={autoRotate}
      />
    </>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Product3DRenderer - Main entry point for slug-driven product rendering.
 * 
 * @example
 * ```tsx
 * <Product3DRenderer slug="sony-walkman-tps-l2" />
 * ```
 */
export function Product3DRenderer({
  slug,
  tier: tierOverride,
  className,
  style,
  onLoad,
  onError,
  showLoader = true,
  fallback,
  interactive = true,
  autoRotate = true,
}: Product3DRendererProps) {
  const { inView, containerRef } = useInViewCanvas();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Detect tier
  const tier = useMemo(() => {
    return tierOverride ?? detectQualityTier();
  }, [tierOverride]);

  // Get performance budget for DPR capping
  const budget = useMemo(() => getPerformanceBudget(tier), [tier]);

  // Camera config from registry
  const cameraConfig = useMemo(() => {
    const lookup = lookupProduct(slug, tier);
    return lookup.config.camera;
  }, [slug, tier]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Note: handleError is available for error boundary integration
  // Currently errors are caught via React error boundaries
  const _handleError = useCallback((err: Error) => {
    setError(err);
    setIsLoading(false);
    onError?.(err);
  }, [onError]);
  
  // Expose error handler for potential future use
  void _handleError;

  // Error boundary fallback
  if (error) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={className} style={style}>
        <div className="w-full h-full flex items-center justify-center bg-archive-100 text-archive-500">
          <p>Unable to load 3D view</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={className} 
      style={{ minHeight: '400px', ...style }}
    >
      {/* Loading indicator */}
      {showLoader && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-archive-100/80 z-10">
          <div className="w-8 h-8 border-2 border-archive-300 border-t-archive-700 rounded-full animate-spin" />
        </div>
      )}

      <Canvas
        camera={{ 
          position: cameraConfig.position, 
          fov: cameraConfig.fov,
          near: cameraConfig.near,
          far: cameraConfig.far,
        }}
        dpr={[budget.minDPR, budget.maxDPR]}
        frameloop={inView ? 'demand' : 'never'}
        gl={{ 
          antialias: budget.enableAntialias,
          powerPreference: 'low-power',
          preserveDrawingBuffer: false,
        }}
        onCreated={() => setIsLoading(false)}
      >
        <ProductScene
          slug={slug}
          tier={tier}
          interactive={interactive}
          autoRotate={autoRotate && !prefersReducedMotion()}
          onLoad={handleLoad}
        />
      </Canvas>
    </div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export { Product3DRenderer as default };
export type { Product3DRendererProps };
