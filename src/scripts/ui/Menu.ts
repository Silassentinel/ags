/**
 * Menu management module for handling mobile navigation
 *
 * The hamburger is a <button aria-expanded aria-controls="nav-links">; this
 * module keeps that state in sync, so screen readers hear "Menu, expanded"
 * and the Escape key closes the menu and returns focus to the button.
 */

const getHamburger = (): HTMLElement | null => document.querySelector('.hamburger');
const getNavLinks = (): HTMLElement | null => document.querySelector('.nav-links');

/** Opens or closes the navigation menu; without an argument it toggles. */
export const setNavMenu = (open: boolean): void => {
  const navLinks = getNavLinks();
  if (!navLinks) return;
  navLinks.classList.toggle('expanded', open);
  getHamburger()?.setAttribute('aria-expanded', String(open));
};

/**
 * Toggles the expanded state of the navigation menu
 */
export const toggleNavMenu = (): void => {
  const navLinks = getNavLinks();
  if (!navLinks) return;
  setNavMenu(!navLinks.classList.contains('expanded'));
};

/** Escape closes an open menu and puts focus back on the button that opened it. */
const handleKeydown = (event: KeyboardEvent): void => {
  if (event.key !== 'Escape') return;
  const navLinks = getNavLinks();
  if (!navLinks?.classList.contains('expanded')) return;
  setNavMenu(false);
  getHamburger()?.focus();
};

/**
 * Initializes the navigation menu functionality
 */
export const initNavMenu = (): (() => void) => {
  // Handle hamburger menu click
  const hamburger = getHamburger();
  if (hamburger) {
    hamburger.addEventListener('click', toggleNavMenu);
  }
  
  // Handle back button click
  const goBack = (): void => window.history.back();
  const goBackButton: HTMLElement | null = document.querySelector(".goBack");
  if (goBackButton) {
    goBackButton.addEventListener('click', goBack);
  }

  document.addEventListener('keydown', handleKeydown);

  // Returns the cleanup, so a component can unmount cleanly
  return () => {
    hamburger?.removeEventListener('click', toggleNavMenu);
    goBackButton?.removeEventListener('click', goBack);
    document.removeEventListener('keydown', handleKeydown);
  };
};

// No self-start on import: src/components/ui/Menu.tsx calls initNavMenu()
// from its mount effect, so importing this module has no side effects.
