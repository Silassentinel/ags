import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { ObfuscatorUtil } from './ObfuscatorUtil';
import type { ChaosConfig, ChaosState } from './types';

// Import utility functions
const safelyModifyClass = (element: HTMLElement, className: string, add: boolean): void => {
  if (add) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
};

const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

const toggleTheme = (): void => {
  const body = document.body;
  if (body) {
    body.classList.toggle('dark-theme');
  }
};

const findElementsNearPosition = (x: number, y: number, radius: number): string[] => {
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
  const nearbyElementIds: string[] = [];

  elements.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distance = calculateDistance(x, y, centerX, centerY);
    if (distance < radius) {
      // Add a data-id if element doesn't have one
      if (!(el as HTMLElement).dataset.id) {
        (el as HTMLElement).dataset.id = `chaos-element-${index}`;
      }
      nearbyElementIds.push(`[data-id="${(el as HTMLElement).dataset.id}"]`);
    }
  });
  
  return nearbyElementIds;
};

// Default configuration
const DEFAULT_CONFIG: ChaosConfig = {
  chaosThreshold: 10,
  ultraChaosThreshold: 25,
  effectRadius: 200,
  obfuscationDelay: 1000,
};

// Text element selectors
const SELECTORS = {
  TEXT_ELEMENTS: 'p, h1, h2, h3, h4, h5, h6, span',
  BRUTALIST_ELEMENTS: '.brutalist, .card, main, article, aside, nav',
};

// Create initial state
const createInitialState = (): ChaosState => {
  // Try to retrieve click count from localStorage
  let storedClickCount = 0;
  if (typeof window !== 'undefined') {
    try {
      const storedValue = localStorage.getItem('chaosClickCount');
      if (storedValue) {
        storedClickCount = parseInt(storedValue, 10);
      }
    } catch (error) {
      console.error('Error retrieving chaosClickCount from localStorage:', error);
    }
  }
  
  // Initialize state
  return {
    clickCount: storedClickCount,
    chaosMode: storedClickCount >= DEFAULT_CONFIG.chaosThreshold,
    ultraChaosMode: storedClickCount >= DEFAULT_CONFIG.ultraChaosThreshold,
    mouseX: 0,
    mouseY: 0,
    lastObfuscationTime: 0,
    rotation: 0,
    hueRotation: 0,
  };
};

interface ChaosModeProps {
  // Optional props if needed
}

export function ChaosMode(props: ChaosModeProps) {
  // Use state instead of class properties
  const [state, setState] = useState<ChaosState>(createInitialState());
  
  // Save click count to localStorage
  const saveClickCount = (count: number) => {
    try {
      localStorage.setItem('chaosClickCount', count.toString());
    } catch (error) {
      console.error('Error storing chaosClickCount in localStorage:', error);
    }
  };
  
  // Handle global click events
  const handleGlobalClick = (event: MouseEvent) => {
    // Check if click target is a navigation element to avoid breaking navigation
    const target = event.target as Element;
    const isNavigationElement = 
      target.tagName === 'A' || 
      target.tagName === 'BUTTON' || 
      !!target.closest('a') || 
      !!target.closest('button');
    
    // Update state with new click count
    const newClickCount = state.clickCount + 1;
    
    // Store updated click count in localStorage
    saveClickCount(newClickCount);
    
    // Update state based on click count
    setState(prevState => {
      const newState = { ...prevState, clickCount: newClickCount };
      
      // Check if we need to activate chaos mode
      if (newClickCount >= DEFAULT_CONFIG.chaosThreshold && !prevState.chaosMode) {
        newState.chaosMode = true;
        // Apply chaos mode effects
        if (document.body) {
          safelyModifyClass(document.body, 'chaos-mode', true);
        }
      }
      
      // Check if we need to activate ultra chaos mode
      if (newClickCount >= DEFAULT_CONFIG.ultraChaosThreshold && !prevState.ultraChaosMode) {
        newState.ultraChaosMode = true;
        // Apply ultra chaos mode effects
        if (document.body) {
          safelyModifyClass(document.body, 'ultra-chaos-mode', true);
          addBrutalistGlitchText();
        }
      }
      
      return newState;
    });
    
    // If already in chaos mode, toggle theme and update font sizes
    if (state.chaosMode) {
      toggleTheme();
      updateChaosFontSizes();
    }
    
    // Apply obfuscation on click in ultra chaos mode (but not for navigation elements)
    if (state.ultraChaosMode && !isNavigationElement) {
      applyObfuscationEffect();
    }
  };
  
  // Apply obfuscation effect to elements near mouse
  const applyObfuscationEffect = () => {
    const now = Date.now();
    // Limit obfuscation to once per second to prevent overload
    if (now - state.lastObfuscationTime > DEFAULT_CONFIG.obfuscationDelay) {
      setState(prevState => ({ ...prevState, lastObfuscationTime: now }));
      
      // Apply random obfuscation to nearby text
      const nearbyElements = findElementsNearPosition(
        state.mouseX, 
        state.mouseY, 
        DEFAULT_CONFIG.effectRadius
      );
      
      if (nearbyElements.length > 0) {
        const selector = nearbyElements.join(', ');
        ObfuscatorUtil.obfuscateElements(selector);
        
        // Restore original text after a delay
        setTimeout(() => {
          ObfuscatorUtil.restoreElements(selector);
        }, 1500);
      }
    }
  };
  
  // Handle mouse movement to update font sizes in chaos mode
  const handleMouseMove = (event: MouseEvent) => {
    if (!state.chaosMode) return;
    
    setState(prevState => ({
      ...prevState,
      mouseX: event.clientX,
      mouseY: event.clientY
    }));
    
    // Only run the font resizing when in chaos mode
    requestAnimationFrame(updateChaosFontSizes);
  };
  
  // Update font sizes based on mouse position in chaos mode
  const updateChaosFontSizes = () => {
    if (!state.chaosMode) return;
    
    try {
      const elements = document.querySelectorAll(SELECTORS.TEXT_ELEMENTS);
      if (!elements || elements.length === 0) return;
      
      elements.forEach(el => {
        if (!(el instanceof HTMLElement)) return;
        
        const rect = el.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;
        
        // Calculate distance from mouse to element center
        const distance = calculateDistance(
          state.mouseX, 
          state.mouseY, 
          elementCenterX, 
          elementCenterY
        );
        
        // The closer to the mouse, the larger the font
        const dropletRadius = 200; // Size of the "droplet" effect area
        
        if (distance < dropletRadius) {
          // Elements close to the mouse get larger (up to 50px font size)
          const normalizedDistance = distance / dropletRadius;
          const fontSize = 50 - (normalizedDistance * 45); // 50px at mouse, down to normal size at the edge
          el.style.fontSize = `${fontSize}px`;
          
          // In ultra chaos mode, also add rotation based on distance
          if (state.ultraChaosMode) {
            const rotationAmount = (1 - normalizedDistance) * 45; // Up to 45 degrees rotation
            el.style.transform = `rotate(${rotationAmount}deg)`;
          }
        } else {
          // Elements far from the mouse get smaller (down to 5px)
          el.style.fontSize = '5px';
          
          // In ultra chaos mode, reset rotation for far elements
          if (state.ultraChaosMode) {
            el.style.transform = 'rotate(0deg)';
          }
        }
      });
    } catch (error) {
      console.error('Error updating font sizes:', error);
    }
  };
  
  // Start animation for ultra chaos mode
  const startUltraChaosAnimation = () => {
    // Only continue if we're in ultra chaos mode
    if (!state.ultraChaosMode) return;
    
    // Animate body rotation and hue
    const animateUltraChaos = () => {
      if (!state.ultraChaosMode) return;
      
      try {
        // Update rotation and hue values
        setState(prevState => ({
          ...prevState,
          rotation: (prevState.rotation + 0.5) % 360,
          hueRotation: (prevState.hueRotation + 2) % 360
        }));
        
        // Apply skew and hue-rotate filters to the entire page
        if (document.body) {
          document.body.style.transform = `skew(${Math.sin(state.rotation * Math.PI / 180) * 5}deg)`;
        }
        
        if (document.documentElement) {
          document.documentElement.style.filter = `hue-rotate(${state.hueRotation}deg)`;
        }
        
        // Apply random border widths to brutalist elements
        const brutalistElements = document.querySelectorAll(SELECTORS.BRUTALIST_ELEMENTS);
        
        brutalistElements.forEach(el => {
          if (!(el instanceof HTMLElement)) return;
          
          // Only change borders every 20 frames to avoid too much flickering
          if (Math.random() < 0.05) {
            const borderWidth = Math.floor(Math.random() * 15) + 2; // 2-16px border
            el.style.borderWidth = `${borderWidth}px`;
          }
        });
        
        // Continue animation
        requestAnimationFrame(animateUltraChaos);
      } catch (error) {
        console.error('Error in ultra chaos animation:', error);
      }
    };
    
    // Start the animation loop
    animateUltraChaos();
  };
  
  // Add brutalist glitch text overlay for ultra chaos mode
  const addBrutalistGlitchText = () => {
    // Only continue if we're in ultra chaos mode
    if (!state.ultraChaosMode || !document.body) return;
    
    try {
      // Check if overlay already exists
      if (document.querySelector('.brutalist-overlay')) return;
      
      // Create brutalist marquee with glitch text
      const brutalistOverlay = document.createElement('div');
      brutalistOverlay.className = 'brutalist-overlay';
      
      // Add brutalist phrases
      const phrases = [
        'Your pc has been hacked',
        'YOU ARE IN CHAOS MODE',
        'GLITCH IN THE MATRIX',
        'NO STYLE',
        'SYSTEM FAILURE',
        'CONTENT OVER FORM',
        'EMBRACE CHAOS',
        'FUNCTION > FORM',
      ];
      
      // Create the marquee
      const marquee = document.createElement('div');
      marquee.className = 'brutalist-marquee';
      
      // Add phrases to marquee
      phrases.forEach(phrase => {
        const span = document.createElement('span');
        span.textContent = phrase;
        span.className = 'glitch-text';
        marquee.appendChild(span);
        
        // Add space between phrases
        const space = document.createElement('span');
        space.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
        marquee.appendChild(space);
      });
      
      brutalistOverlay.appendChild(marquee);
      document.body.appendChild(brutalistOverlay);
      
      // Randomly toggle content visibility for glitch effect
      setInterval(() => {
        if (Math.random() < 0.1 && document.body) {
          safelyModifyClass(document.body, 'glitch-effect', true);
          setTimeout(() => safelyModifyClass(document.body, 'glitch-effect', false), 100);
        }
      }, 1000);
    } catch (error) {
      console.error('Error adding brutalist glitch text:', error);
    }
  };
  
  // Set up effects when component mounts
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Add event listeners
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('mousemove', handleMouseMove);
    
    // Apply appropriate chaos mode immediately based on click count
    if (state.ultraChaosMode) {
      if (document.body) {
        safelyModifyClass(document.body, 'chaos-mode', true);
        safelyModifyClass(document.body, 'ultra-chaos-mode', true);
      }
      startUltraChaosAnimation();
      addBrutalistGlitchText();
    } else if (state.chaosMode) {
      if (document.body) {
        safelyModifyClass(document.body, 'chaos-mode', true);
      }
    }
    
    // Cleanup function to remove event listeners when component unmounts
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [state.chaosMode, state.ultraChaosMode]); // Re-run when chaos mode state changes
  
  // The component doesn't render any visible UI of its own
  return null;
}

// Export the component
export default ChaosMode;