/**
 * ChaosMode utilities - Common helper functions
 * 
 * A collection of utility functions used across the ChaosMode feature.
 */

/**
 * Safely modify CSS classes on DOM elements with error handling
 * @param element - The element to modify
 * @param className - CSS class name to add or remove
 * @param shouldAdd - Whether to add (true) or remove (false) the class
 */
export const safelyModifyClass = (element: Element | null, className: string, shouldAdd: boolean): void => {
  if (!element || !element.classList) return;
  
  try {
    if (shouldAdd) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  } catch (error) {
    console.error(`Error ${shouldAdd ? 'adding' : 'removing'} class "${className}":`, error);
  }
};

/**
 * Calculate distance between two points using the Pythagorean theorem
 * @param x1 - First point X coordinate
 * @param y1 - First point Y coordinate
 * @param x2 - Second point X coordinate
 * @param y2 - Second point Y coordinate
 * @returns Distance between points
 */
export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Check if an element is visible in the viewport
 * @param element - The element to check
 * @returns Whether the element is visible
 */
export const isElementVisible = (element: Element): boolean => {
  const rect = element.getBoundingClientRect();
  return !(rect.top > window.innerHeight || rect.bottom < 0);
};

/**
 * Toggle between light and dark theme
 */
export const toggleTheme = (): void => {
  const element = document.documentElement;
  if (!element) return;
  
  try {
    element.classList.toggle("dark");
    const isDark = element.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  } catch (error) {
    console.error('Error toggling theme:', error);
  }
};

/**
 * Find elements near a specified position on the page
 * @param x - X position
 * @param y - Y position
 * @param radius - Radius to search within
 * @returns Array of selectors for elements near the position
 */
export const findElementsNearPosition = (x: number, y: number, radius: number): string[] => {
  try {
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, li');
    const nearbyElements: string[] = [];
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = calculateDistance(x, y, centerX, centerY);
      
      if (distance < radius) {
        // Get a unique selector for this element
        if (el.id) {
          nearbyElements.push(`#${el.id}`);
        } else if (el.classList.length > 0) {
          nearbyElements.push(`.${Array.from(el.classList).join('.')}`);
        } else {
          // If no id or class, we'll just use the tag
          nearbyElements.push(el.tagName.toLowerCase());
        }
      }
    });
    
    return nearbyElements;
  } catch (error) {
    console.error('Error finding elements near position:', error);
    return [];
  }
};