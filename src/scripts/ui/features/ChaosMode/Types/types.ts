/**
 * ChaosMode Types - Configuration and type definitions
 * 
 * This file contains all type definitions and default configuration
 * for the ChaosMode feature.
 */

/**
 * Configuration for ChaosMode feature
 */
export interface ChaosConfig {
  /** Minimum click threshold to activate basic chaos mode */
  chaosThreshold: number;
  /** Minimum click threshold to activate ultra chaos mode */
  ultraChaosThreshold: number;
  /** Maximum distance for mouse proximity effects in pixels */
  effectRadius: number;
  /** Delay between obfuscation effects in milliseconds */
  obfuscationDelay: number;
}

/**
 * Runtime state for ChaosMode
 */
export interface ChaosState {
  /** Current click count */
  clickCount: number;
  /** Whether chaos mode is active */
  chaosMode: boolean;
  /** Whether ultra chaos mode is active */
  ultraChaosMode: boolean;
  /** Current mouse X position */
  mouseX: number;
  /** Current mouse Y position */
  mouseY: number;
  /** Current rotation value for animation */
  rotation: number;
  /** Current hue rotation value for animation */
  hueRotation: number;
  /** Timestamp of last obfuscation effect */
  lastObfuscationTime: number;
}

/**
 * Default configuration for ChaosMode
 */
export const DEFAULT_CONFIG: ChaosConfig = {
  chaosThreshold: 5,      // Activate basic chaos after 5 clicks
  ultraChaosThreshold: 25, // Activate ultra chaos after 25 clicks
  effectRadius: 300,       // 300px radius for proximity effects
  obfuscationDelay: 1000   // 1 second delay between obfuscation effects
};

/**
 * Create the initial ChaosState
 * @returns Initialized ChaosState object
 */
export function createInitialState(): ChaosState {
  // Get click count from localStorage (if available)
  const clickCount = typeof window !== 'undefined'
    ? parseInt(localStorage.getItem('chaosClickCount') || '0', 10)
    : 0;
  
  return {
    clickCount,
    chaosMode: clickCount >= DEFAULT_CONFIG.chaosThreshold,
    ultraChaosMode: clickCount >= DEFAULT_CONFIG.ultraChaosThreshold,
    mouseX: 0,
    mouseY: 0,
    rotation: 0,
    hueRotation: 0,
    lastObfuscationTime: 0
  };
}

/**
 * Common selectors used throughout the ChaosMode feature
 */
export const SELECTORS = {
  TEXT_ELEMENTS: 'p, h1, h2, h3, h4, h5, h6, span, a, li, blockquote',
  BRUTALIST_ELEMENTS: '.brutalist-card, blockquote, .brutalist-intro, .brutalist-grid, .brutalist-section-title',
  HEADING_ELEMENTS: 'p, h1, h2, h3, h4, h5, h6',
  INTERACTIVE_ELEMENTS: 'a, button'
};