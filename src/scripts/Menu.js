/**
 * This file is a compatibility layer that imports the menu functionality from the ui folder.
 * It's maintained for backward compatibility with any existing code that references this file.
 */

// Import and re-export from ui/Menu.js
import { initNavMenu, toggleNavMenu } from './ui/Menu.js';

export { initNavMenu, toggleNavMenu };

// Initialize navigation menu
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initNavMenu);
}