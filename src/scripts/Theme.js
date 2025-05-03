/**
 * This file is a compatibility layer that imports the theme functionality from the ui folder.
 * It's maintained for backward compatibility with any existing code that references this file.
 */

// Import and re-export from ui/Theme.js
import { initTheme, handleToggleClick } from './ui/Theme.js';

export { initTheme, handleToggleClick };

// Initialize the theme
if (typeof window !== 'undefined') {
  initTheme();
}