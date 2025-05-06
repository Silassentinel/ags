// Types for the ChaosMode component

export interface ChaosConfig {
  chaosThreshold: number;
  ultraChaosThreshold: number;
  effectRadius: number;
  obfuscationDelay: number;
}

export interface ChaosState {
  clickCount: number;
  chaosMode: boolean;
  ultraChaosMode: boolean;
  mouseX: number;
  mouseY: number;
  lastObfuscationTime: number;
  rotation: number;
  hueRotation: number;
}

export type ObfuscationMethod = 
  | 'reverse'
  | 'leetspeak'
  | 'scramble'
  | 'randomCapitalize'
  | 'zalgo';

export interface ObfuscationOptions {
  /** Specific method to use (random if not specified) */
  method?: ObfuscationMethod;
  /** Only obfuscate elements that are visible in viewport */
  onlyVisible?: boolean;
  /** Intensity level for effects that support it (e.g. zalgo) */
  intensity?: number;
}

export interface CyclicObfuscationOptions extends ObfuscationOptions {
  /** Interval between method changes in milliseconds */
  interval?: number;
  /** Total duration to run in milliseconds (0 for infinite) */
  duration?: number;
}