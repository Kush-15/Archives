/**
 * PerformanceToggle — Floating pill button to cycle / reset visual quality tiers.
 *
 * Placement: bottom-right, fixed, z-index 999.
 * Clicking cycles:  low → medium → high → low
 * The × badge resets to auto-detection (only shown when a manual override is active).
 *
 * This is intentionally self-contained (all styles inline) so it works on every
 * page regardless of which CSS file is loaded.
 */

import { usePerformance } from '@/context/PerformanceContext';
import type { QualityTier } from '@/lib/product3d/types';

const LABELS: Record<QualityTier, string> = {
  low:    'Performance',
  medium: 'Balanced',
  high:   'Enhanced',
};

const CYCLE: Record<QualityTier, QualityTier> = {
  low:    'medium',
  medium: 'high',
  high:   'low',
};

const DOT_COLOR: Record<QualityTier, string> = {
  low:    '#FF6B6B',
  medium: '#FFD700',
  high:   '#7CFC00',
};

const TIER_HINT: Record<QualityTier, string> = {
  low:    'No 3D • minimal animations',
  medium: 'Capped DPR • reduced lighting',
  high:   'Full visual experience',
};

export default function PerformanceToggle() {
  const { tier, isOverride, setOverrideTier } = usePerformance();

  const handleCycle = () => setOverrideTier(CYCLE[tier]);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOverrideTier(null);
  };

  return (
    <div
      role="group"
      aria-label="Visual quality controls"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.35rem',
        pointerEvents: 'none', // container passthrough
      }}
    >
      {/* Hint line */}
      <span
        style={{
          fontFamily: 'var(--font-mono, "DM Mono", monospace)',
          fontSize: '0.52rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(248,247,244,0.35)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {TIER_HINT[tier]}
      </span>

      {/* Pill */}
      <button
        onClick={handleCycle}
        aria-label={`Visual quality: ${LABELS[tier]}. Click to cycle tiers.`}
        title={`Cycle visual quality tier (currently: ${LABELS[tier]})`}
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.42rem 0.9rem',
          background: 'rgba(8,8,8,0.84)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '2rem',
          fontFamily: 'var(--font-mono, "DM Mono", monospace)',
          fontSize: '0.58rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#F8F7F4',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          userSelect: 'none',
          lineHeight: 1,
          transition: 'border-color 0.2s ease',
          outline: 'none',
        }}
      >
        {/* Tier-coloured status dot */}
        <span
          style={{
            width: '0.42rem',
            height: '0.42rem',
            borderRadius: '50%',
            background: DOT_COLOR[tier],
            flexShrink: 0,
            display: 'inline-block',
          }}
          aria-hidden="true"
        />

        <span>{LABELS[tier]}</span>

        {/* Reset badge — only shown when user has a manual override */}
        {isOverride && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Reset to auto-detected tier"
            title="Reset to auto-detected tier"
            onClick={handleReset}
            onKeyDown={(e) => e.key === 'Enter' && handleReset(e as unknown as React.MouseEvent)}
            style={{
              marginLeft: '0.15rem',
              opacity: 0.45,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              lineHeight: 1,
            }}
          >
            ×
          </span>
        )}
      </button>
    </div>
  );
}
