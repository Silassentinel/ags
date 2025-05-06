import { h } from 'preact';
import { useEffect } from 'preact/hooks';

interface MenuProps {
  // Optional props if needed
}

export function Menu(props: MenuProps) {
  /**
   * Toggles the expanded state of the navigation menu
   */
  const toggleNavMenu = (): void => {
    const navLinks: HTMLElement | null = document.querySelector('.nav-links');
    if (navLinks) {
      navLinks.classList.toggle('expanded');
    }
  };

  /**
   * Initializes menu event listeners
   */
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Handle hamburger menu click
    const hamburger: HTMLElement | null = document.querySelector('.hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', toggleNavMenu);
    }
    
    // Handle back button click
    const goBackButton: HTMLElement | null = document.querySelector(".goBack");
    if (goBackButton) {
      goBackButton.addEventListener('click', () => window.history.back());
    }
    
    // Cleanup function to remove event listeners when component unmounts
    return () => {
      if (hamburger) {
        hamburger.removeEventListener('click', toggleNavMenu);
      }
      if (goBackButton) {
        goBackButton.removeEventListener('click', () => window.history.back());
      }
    };
  }, []); // Run once on component mount
  
  // The component doesn't render any visible UI of its own
  return null;
}

export default Menu;