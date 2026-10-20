import { h } from 'preact';
import { useEffect } from 'preact/hooks';

interface ThemeProps {
  // Optional props if needed
}

export function Theme(props: ThemeProps) {
  /**
   * Detects the initial theme based on localStorage or system preference
   */
  const detectInitialTheme = (): string => {
    if (typeof window === 'undefined') return 'light';
    
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      return localStorage.getItem('theme') || 'light';
    }
    
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  };
  
  /**
   * Handles the theme toggle button click
   */
  const handleToggleClick = (): void => {
    const element = document.documentElement;
    element.classList.toggle("dark");

    const isDark = element.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    reflectPressed(isDark);
  };

  /** Keeps aria-pressed on the toggle button in step with the theme (it is a toggle button, WCAG 4.1.2). */
  const reflectPressed = (isDark: boolean): void => {
    document.getElementById("themeToggle")?.setAttribute("aria-pressed", String(isDark));
  };

  /**
   * Initialize theme and event listeners
   */
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const theme = detectInitialTheme();
    
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    reflectPressed(theme !== 'light');

    window.localStorage.setItem('theme', theme);

    // Add event listener to theme toggle button if it exists
    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      // Use both click and touchend events for better mobile support
      themeToggle.addEventListener("click", function(e) {
        e.preventDefault();
        handleToggleClick();
      });
      
      themeToggle.addEventListener("touchend", function(e) {
        e.preventDefault();
        handleToggleClick();
      });
    }
    
    // The Settings panel's "Dark Mode" switch flips the class itself; mirror it on the button
    const observer = new MutationObserver(() => reflectPressed(document.documentElement.classList.contains('dark')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      observer.disconnect();
      if (themeToggle) {
        themeToggle.removeEventListener("click", (e) => {
          e.preventDefault();
          handleToggleClick();
        });
        
        themeToggle.removeEventListener("touchend", (e) => {
          e.preventDefault();
          handleToggleClick();
        });
      }
    };
  }, []); // Run once on component mount
  
  // The component doesn't render any visible UI of its own
  return null;
}

export default Theme;