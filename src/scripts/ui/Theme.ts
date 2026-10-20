/**
 * Theme management module for handling light/dark theme switching
 */

/**
 * Detects the initial theme based on localStorage or system preference
 */
const detectInitialTheme = (): string => {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
    return localStorage.getItem('theme') || 'light';
  }
  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

/**
 * Initializes the theme on page load
 */
export const initTheme = (): void => {
  const theme = detectInitialTheme();
  
  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
  reflectPressed(theme !== 'light');

  window.localStorage.setItem('theme', theme || 'light');

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
};

/**
 * Handles the theme toggle button click
 */
export const handleToggleClick = (): void => {
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

// Initialize theme when this module is loaded
if (typeof window !== 'undefined') {
  initTheme();
}