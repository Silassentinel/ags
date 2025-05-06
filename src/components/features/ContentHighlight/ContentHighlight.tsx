import { h } from 'preact';
import { useEffect } from 'preact/hooks';

/**
 * Gets the current screen dimensions
 */
const GetScreenDimensions = (): { horizontal: number, vertical: number } => {
  if (typeof window === 'undefined') return { horizontal: 0, vertical: 0 };
  
  const horizontal = window.innerWidth;
  const vertical = window.innerHeight;
  return { horizontal, vertical };
};

interface HighlightObserverOptions {
  /** The element used as the viewport for checking visibility (null = browser viewport) */
  root: Element | null;
  /** Margin around the root element */
  rootMargin: string;
  /** Percentage of element that must be visible to trigger callback (0.0-1.0) */
  threshold: number;
}

interface ContentHighlightProps {
  // Optional props if needed
  rootMargin?: string;
  threshold?: number;
}

/**
 * ContentHighlight component that manages the visibility-based highlighting
 * of elements with the 'highlight-in-viewport' class
 */
export function ContentHighlight({ 
  rootMargin = '-20% 0px', 
  threshold = 0.6 
}: ContentHighlightProps) {
  // Initialize screen dimensions
  const screenDimensions = GetScreenDimensions();
  
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const highlightElements = document.querySelectorAll<HTMLElement>('.highlight-in-viewport');
    
    const observerOptions: HighlightObserverOptions = {
      root: null, // use viewport as reference
      rootMargin, // shrink the effective viewport by the specified amount
      threshold // element is considered "in center" at this visibility threshold
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
    
    // Clean up observer when component unmounts
    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]); // Re-run if these props change
  
  // The component doesn't render any visible UI of its own
  return null;
}

export default ContentHighlight;