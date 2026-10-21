/**
 * The visitor's preferences for the ASCII backdrop: on/off and intensity,
 * stored in localStorage like the other Settings-panel features, and the
 * mapping from intensity to opacity. Pure apart from the storage access,
 * which is guarded (Safari private mode throws on setItem).
 */

/** localStorage key for the switch: 'enabled' | 'disabled'. */
export const STORAGE_ENABLED = 'asciiBackground';
/** localStorage key for the slider: '0'..'100'. */
export const STORAGE_INTENSITY = 'asciiBackgroundIntensity';

/** Feature id used in the Settings panel and its `feature-toggle` event. */
export const FEATURE_ID = 'ascii-background';
/** Setting id used in the `feature-setting` event for the slider. */
export const INTENSITY_SETTING_ID = 'ascii-background-intensity';

export const DEFAULT_INTENSITY = 30;
/** Opacity at intensity 100 in light mode; also the cap in dark mode. */
export const MAX_OPACITY = 0.6;
/** Dark mode needs more opacity for the same visual weight. */
export const DARK_BOOST = 1.5;

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const storage = (): StorageLike | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

/** An integer 0–100; anything unparsable becomes the default. */
export function clampIntensity(value: unknown): number {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(n)) return DEFAULT_INTENSITY;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** True when the visitor's system asks for reduced motion (WCAG 2.3.3). */
export function prefersReducedMotion(): boolean {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Whether the backdrop plays. A stored choice always wins; without one it is
 * on, except for visitors who ask for reduced motion, who get it off and can
 * opt in from the Settings panel.
 */
export function readEnabled(store: StorageLike | null = storage(), reducedMotion: boolean = prefersReducedMotion()): boolean {
  try {
    const stored = store?.getItem(STORAGE_ENABLED);
    if (stored === 'enabled') return true;
    if (stored === 'disabled') return false;
    return !reducedMotion;
  } catch {
    return !reducedMotion;
  }
}

export function writeEnabled(enabled: boolean, store: StorageLike | null = storage()): void {
  try {
    store?.setItem(STORAGE_ENABLED, enabled ? 'enabled' : 'disabled');
  } catch {
    /* storage unavailable: the choice holds for this page only */
  }
}

export function readIntensity(store: StorageLike | null = storage()): number {
  try {
    const raw = store?.getItem(STORAGE_INTENSITY);
    return raw === null || raw === undefined ? DEFAULT_INTENSITY : clampIntensity(raw);
  } catch {
    return DEFAULT_INTENSITY;
  }
}

export function writeIntensity(value: number, store: StorageLike | null = storage()): void {
  try {
    store?.setItem(STORAGE_INTENSITY, String(clampIntensity(value)));
  } catch {
    /* storage unavailable */
  }
}

/** The wrapper's opacity for an intensity (0–100), boosted and capped in dark mode. */
export function opacityFor(intensity: number, dark: boolean): number {
  const base = (clampIntensity(intensity) / 100) * MAX_OPACITY;
  const value = Math.min(MAX_OPACITY, dark ? base * DARK_BOOST : base);
  return Math.round(value * 1000) / 1000;
}
