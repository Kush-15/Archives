/**
 * PerformanceContext — App-level device-tier detection and manual override.
 *
 * Signals used (in priority order):
 *  1. GPU renderer string  (most reliable — identifies exact GPU class)
 *  2. navigator.deviceMemory (Chrome/Edge only; treated as a hint, not ground truth)
 *  3. navigator.hardwareConcurrency (CPU core count)
 *  4. WebGL2 support + max texture size
 *  5. Mobile user-agent (battery / thermal penalty)
 *  6. prefers-reduced-motion (accessibility — caps heavy animations)
 *  7. Viewport width (tiny screens flag weak devices conservatively)
 *
 * When deviceMemory is null (Firefox, Safari) the scorer falls back to GPU +
 * CPU data alone and biases toward 'medium' rather than penalising the user.
 *
 * Tier meanings:
 *  low    — no 3D Canvas, static poster fallbacks, no custom cursor, minimal loader
 *  medium — 3D allowed with DPR cap, simpler lighting, fewer animations
 *  high   — full visual experience
 *
 * Manual override is persisted in localStorage so the user's choice survives
 * page reloads. A small PerformanceToggle component cycles through all three
 * tiers.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  detectCapabilities,
  detectQualityTier,
  forceQualityTier,
  prefersReducedMotion as getInitialReducedMotion,
  shouldDowngradeTier,
  recordTierDowngrade,
} from '@/lib/product3d/tierDetection';
import type { QualityTier, DeviceCapabilities } from '@/lib/product3d/types';

// ─────────────────────────────────────────────────────────────────────────────
// Public API types
// ─────────────────────────────────────────────────────────────────────────────

/** Derived render settings exposed to every component. */
export interface PerformanceProfile {
  /** Active quality tier (may differ from raw detection if overridden) */
  tier: QualityTier;
  /** Raw device capabilities snapshot */
  capabilities: DeviceCapabilities;
  /** True when OS/browser reports prefers-reduced-motion */
  reducedMotion: boolean;
  /** True when the user has manually selected a tier */
  isOverride: boolean;

  // ── Per-tier render settings ────────────────────────────────────────────────
  /** [min, max] DPR range for R3F Canvas components */
  dpr: [number, number];
  /** Whether 3D Canvas scenes should render (false → serve static fallback) */
  use3D: boolean;
  /** Whether full GSAP entrance animations are allowed */
  useHeavyAnimations: boolean;
  /** Whether the GSAP-powered custom cursor is enabled */
  useCustomCursor: boolean;
  /** Whether the full intro loader sequence should run */
  useLoader: boolean;
  /** Maximum number of shadow-casting directional lights */
  maxShadowLights: number;
}

export interface PerformanceContextValue extends PerformanceProfile {
  /**
   * Manually override the tier. Pass null to revert to auto-detection.
   * The choice is persisted in localStorage.
   */
  setOverrideTier: (tier: QualityTier | null) => void;
  /**
   * Call this from a Canvas rAF loop when sustained FPS drops are detected.
   * Downgrades by one step, maximum once per session, ignored when user has
   * a manual override active.
   */
  runtimeDowngrade: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'arc_perf_tier';
const TIER_ORDER: QualityTier[] = ['low', 'medium', 'high'];

function tierDown(t: QualityTier): QualityTier {
  const idx = TIER_ORDER.indexOf(t);
  return idx > 0 ? (TIER_ORDER[idx - 1] as QualityTier) : 'low';
}

function safeDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 2;
  return Math.min(window.devicePixelRatio ?? 1, 3);
}

function profileFromTier(
  tier: QualityTier,
  caps: DeviceCapabilities,
  isOverride: boolean,
  reducedMotion: boolean,
): PerformanceProfile {
  // If user prefers reduced motion, cap animations at medium level
  const effectiveTier: QualityTier =
    reducedMotion && tier === 'high' ? 'medium' : tier;

  const maxDeviceDPR = safeDevicePixelRatio();
  const dprMap: Record<QualityTier, [number, number]> = {
    low:    [1, 1],
    medium: [1, 1.5],
    high:   [1, Math.min(maxDeviceDPR, 2)],
  };

  return {
    tier:               effectiveTier,
    capabilities:       caps,
    reducedMotion,
    isOverride,
    dpr:                dprMap[effectiveTier],
    use3D:              effectiveTier !== 'low',
    useHeavyAnimations: effectiveTier === 'high' && !reducedMotion,
    useCustomCursor:    effectiveTier !== 'low',
    useLoader:          effectiveTier !== 'low',
    maxShadowLights:    effectiveTier === 'high' ? 2 : effectiveTier === 'medium' ? 1 : 0,
  };
}

/**
 * Apply conservative viewport-based tier ceiling.
 * Very small viewports (< 400 px) likely mean low-RAM phones — cap at medium.
 * This only affects the initial detection, not manual overrides.
 */
function applyViewportCeiling(detected: QualityTier): QualityTier {
  if (typeof window === 'undefined') return detected;
  const vw = window.innerWidth;
  if (vw < 400 && detected === 'high') return 'medium';
  return detected;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

export function PerformanceProvider({ children }: { children: ReactNode }) {
  // Capabilities are read once — they never change during a session
  const capabilities = useMemo(() => detectCapabilities(), []);

  // Restore user's persisted override on mount
  const [overrideTier, setOverrideTierInternal] = useState<QualityTier | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as QualityTier | null;
      if (saved && TIER_ORDER.includes(saved)) return saved;
    } catch { /* private browsing / SSR */ }
    return null;
  });

  // Auto-detected tier (may be downgraded at runtime on FPS drops)
  const [runtimeTier, setRuntimeTier] = useState<QualityTier>(() =>
    applyViewportCeiling(detectQualityTier()),
  );

  // Reactive reduced-motion state (changes when user toggles OS setting)
  const [reducedMotion, setReducedMotion] = useState(() => getInitialReducedMotion());

  // Guard: only allow one automatic downgrade per session
  const [hasDowngraded, setHasDowngraded] = useState(false);

  // Keep reduced-motion in sync reactively
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Derive active tier: manual override wins, otherwise runtime auto-detect
  const activeTier: QualityTier = overrideTier ?? runtimeTier;

  const profile = useMemo(
    () => profileFromTier(activeTier, capabilities, !!overrideTier, reducedMotion),
    [activeTier, capabilities, overrideTier, reducedMotion],
  );

  const setOverrideTier = useCallback((tier: QualityTier | null) => {
    setOverrideTierInternal(tier);
    forceQualityTier(tier); // keep tierDetection.ts cache in sync
    try {
      if (tier) {
        localStorage.setItem(STORAGE_KEY, tier);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  const runtimeDowngrade = useCallback(() => {
    // Respect user override — never auto-downgrade below their choice
    if (hasDowngraded || overrideTier !== null) return;
    if (shouldDowngradeTier()) {
      recordTierDowngrade();
      setHasDowngraded(true);
      setRuntimeTier((prev) => tierDown(prev));
    }
  }, [hasDowngraded, overrideTier]);

  const value = useMemo(
    (): PerformanceContextValue => ({ ...profile, setOverrideTier, runtimeDowngrade }),
    [profile, setOverrideTier, runtimeDowngrade],
  );

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance(): PerformanceContextValue {
  const ctx = useContext(PerformanceContext);
  if (!ctx) {
    throw new Error('usePerformance must be used inside <PerformanceProvider>');
  }
  return ctx;
}
