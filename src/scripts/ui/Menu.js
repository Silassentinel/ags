/**
 * Menu management module for handling mobile navigation
 */

/**
 * Initializes the navigation menu functionality
 */
export const initNavMenu = () => {
  // Handle hamburger menu click
  const hamburger = document.querySelector('.hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', toggleNavMenu);
  }
  
  // Handle back button click
  const goBackButton = document.querySelector(".goBack");
  if (goBackButton) {
    goBackButton.addEventListener('click', () => window.history.back());
  }
};

/**
 * Toggles the expanded state of the navigation menu
 */
export const toggleNavMenu = () => {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('expanded');
  }
};

// Initialize menu when this module is loaded
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initNavMenu);
}