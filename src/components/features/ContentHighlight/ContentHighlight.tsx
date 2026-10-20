import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import { prefersReducedMotion } from '../../../scripts/ui/features/AsciiBackground/prefs';

/**
 * Gets the current screen dimensions
 */
const GetScreenDimensions = (): { horizontal: number, vertical: number } => {
  if (typeof window === 'undefined') return { horizontal: 0, vertical: 0 };
  
  const horizontal = window.innerWidth;
  const vertical = window.innerHeight;
  return { horizontal, vertical };
};

/**
 * Whether the highlighter is on: the Settings panel's stored choice wins;
 * without one it is on, except for visitors who ask for reduced motion
 * (the highlight scales and fades elements as they scroll).
 */
export const isContentHighlightEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem('contentHighlighter');
    if (stored === 'enabled') return true;
    if (stored === 'disabled') return false;
  } catch {
    /* storage unavailable */
  }
  return !prefersReducedMotion();
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

    let observer: IntersectionObserver | null = null;

    const start = () => {
      if (observer) return;
      const highlightElements = document.querySelectorAll<HTMLElement>('.highlight-in-viewport');

      const observerOptions: HighlightObserverOptions = {
        root: null, // use viewport as reference
        rootMargin, // shrink the effective viewport by the specified amount
        threshold // element is considered "in center" at this visibility threshold
      };

      observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
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

      highlightElements.forEach(element => observer!.observe(element));
    };

    const stop = () => {
      observer?.disconnect();
      observer = null;
      document.querySelectorAll('.content-highlighted, .content-darkened').forEach(element => {
        element.classList.remove('content-highlighted', 'content-darkened');
      });
    };

    // React to the Settings panel's "Content Highlighter" switch
    const onToggle = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; enabled: boolean }>).detail;
      if (detail?.id !== 'content-highlighter') return;
      if (detail.enabled) start();
      else stop();
    };
    document.addEventListener('feature-toggle', onToggle);

    if (isContentHighlightEnabled()) start();

    // Clean up observer when component unmounts
    return () => {
      document.removeEventListener('feature-toggle', onToggle);
      stop();
    };
  }, [rootMargin, threshold]); // Re-run if these props change

  // The component doesn't render any visible UI of its own
  return null;
}

export default ContentHighlight;