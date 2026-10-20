/**
 * ChaosMode Feature - Index.ts
 * 
 * Entry point for the ChaosMode feature that creates entertaining chaos
 * effects when users click repeatedly on the website. This is a fun
 * easter egg that introduces brutalist design elements and text obfuscation
 * as users engage more with the page.
 * 
 * Inspired by brutalism web design principles and chaos theory.
 */

import { initChaosMode } from './ChaosMode';
import { 
  obfuscateElements, 
  restoreElements,
  cyclicObfuscation,
  type ObfuscationMethod,
  type ObfuscationOptions,
  type CyclicObfuscationOptions 
} from './Obfuscator';
import type { 
  ChaosConfig, 
  ChaosState, 
  DEFAULT_CONFIG 
} from './Types/types';

// Export public API
export {
  // Main initialization function
  initChaosMode,
  
  // Obfuscator functionality for direct use
  obfuscateElements,
  restoreElements,
  cyclicObfuscation,
};

// Type exports need to use 'export type' syntax when verbatimModuleSyntax is enabled
export type {
  // Types
  ObfuscationMethod,
  ObfuscationOptions,
  CyclicObfuscationOptions,
  ChaosConfig,
  ChaosState,
  DEFAULT_CONFIG
};

// No auto-initialisation here either: the Preact ChaosMode component owns
// the lifecycle (see ChaosMode.ts).
