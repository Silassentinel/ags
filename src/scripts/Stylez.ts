/**
 * This file is a compatibility layer that imports style utilities from the ui folder.
 * It's maintained for backward compatibility with any existing code that references this file.
 */

// Import and re-export from ui/Stylez.ts
import { Stylez, skillColor, fontWeight, textCase } from './ui/Stylez';

export { Stylez, skillColor, fontWeight, textCase };