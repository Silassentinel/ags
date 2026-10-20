/**
 * Menu management module for handling mobile navigation
 */

/**
 * Initializes the navigation menu functionality
 */
export const initNavMenu = (): (() => void) => {
  // Handle hamburger menu click
  const hamburger: HTMLElement | null = document.querySelector('.hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', toggleNavMenu);
  }
  
  // Handle back button click
  const goBack = (): void => window.history.back();
  const goBackButton: HTMLElement | null = document.querySelector(".goBack");
  if (goBackButton) {
    goBackButton.addEventListener('click', goBack);
  }

  // Returns the cleanup, so a component can unmount cleanly
  return () => {
    hamburger?.removeEventListener('click', toggleNavMenu);
    goBackButton?.removeEventListener('click', goBack);
  };
};

/**
 * Toggles the expanded state of the navigation menu
 */
export const toggleNavMenu = (): void => {
  const navLinks: HTMLElement | null = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('expanded');
  }
};

// No self-start on import: src/components/ui/Menu.tsx calls initNavMenu()
// from its mount effect, so importing this module has no side effects.