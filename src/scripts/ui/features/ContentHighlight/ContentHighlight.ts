const GetScreenDimensions = (): { horizontal: number, vertical: number } => {
  const horizontal = window.innerWidth;
  const vertical = window.innerHeight;
  return { horizontal, vertical };
};

const { horizontal, vertical } = GetScreenDimensions();


/**
 * Content highlighting script
 * Highlights elements when they are in the center of the viewport
 * and darkens them when they move out of view
 */

interface HighlightObserverOptions {
  /** The element used as the viewport for checking visibility (null = browser viewport) */
  root: Element | null;
  /** Margin around the root element */
  rootMargin: string;
  /** Percentage of element that must be visible to trigger callback (0.0-1.0) */
  threshold: number;
}

/**
 * Initialize the content highlight functionality
 */
const initContentHighlight = (): void => {
  const highlightElements = document.querySelectorAll<HTMLElement>('.highlight-in-viewport');
  
  const observerOptions: HighlightObserverOptions = {
    root: null, // use viewport as reference
    rootMargin: '-20% 0px', // shrink the effective viewport by 20% vertically
    threshold: 0.6 // element is considered "in center" when 60% visible
  };
  
  const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Element is in center of viewport
        entry.target.classList.add('content-highlighted');
        entry.target.classList.remove('content-darkened');
      } else {
        // Element is not in center of viewport
        entry.target.classList.remove('content-highlighted');
        entry.target.classList.add('content-darkened');
      }
    });
  }, observerOptions);
  
  // Start observing each element
  highlightElements.forEach(element => {
    observer.observe(element);
  });
};

/**
 * Initialize when DOM is loaded
 */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initContentHighlight);
  
  // If document is already loaded, initialize immediately
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initContentHighlight();
  }
}


export { initContentHighlight };