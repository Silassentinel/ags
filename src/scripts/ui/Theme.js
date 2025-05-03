/**
 * Theme management module for handling light/dark theme switching
 */

/**
 * Detects the initial theme based on localStorage or system preference
 */
const detectInitialTheme = () => {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
    return localStorage.getItem('theme');
  }
  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

/**
 * Initializes the theme on page load
 */
export const initTheme = () => {
  const theme = detectInitialTheme();
  
  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }

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
export const handleToggleClick = () => {
  const element = document.documentElement;
  element.classList.toggle("dark");

  const isDark = element.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
};

// Initialize theme when this module is loaded
if (typeof window !== 'undefined') {
  initTheme();
}