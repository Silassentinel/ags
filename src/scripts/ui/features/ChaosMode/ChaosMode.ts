/**
 * ChaosMode.ts - A module that creates chaos effects when users click too much
 * 
 * This is a fun easter egg inspired by brutalism web design principles.
 * It applies various playful effects as users click more on the page.
 */

// Import from shared modules
import { 
  obfuscateElements, 
  restoreElements 
} from './Obfuscator';

import {
  safelyModifyClass,
  calculateDistance,
  toggleTheme,
  findElementsNearPosition
} from './Utils/utilities';

// Import types
import type {
  ChaosConfig,
  ChaosState
} from './Types/types';

// Import values
import {
  DEFAULT_CONFIG,
  createInitialState,
  SELECTORS
} from './Types/types';

/**
 * ChaosMode class - Encapsulates chaos mode functionality and state
 * 
 * This class manages the chaos effects that occur when users interact
 * with the page excessively, creating a brutalist design experience.
 */
export class ChaosMode {
  /** Current state of chaos mode */
  private state: ChaosState;
  
  /**
   * Creates a new ChaosMode instance
   */
  constructor() {
    this.state = createInitialState();
  }
  
  /**
   * Initializes the chaos mode functionality
   * This should be called when the DOM is ready
   * 
   * @returns {void}
   */
  public initialize(): void {
    if (typeof window === 'undefined') return;
    
    // Set up event listeners
    document.addEventListener('click', this.handleGlobalClick.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    
    // Apply appropriate chaos mode immediately based on click count
    if (this.state.ultraChaosMode) {
      this.applyUltraChaosMode();
    } else if (this.state.chaosMode) {
      this.applyChaosMode();
    }
  }

  /**
   * Applies regular chaos mode effects
   * 
   * @returns {void}
   */
  private applyChaosMode(): void {
    if (document.body) {
      safelyModifyClass(document.body, 'chaos-mode', true);
      this.updateChaosFontSizes();
    }
  }
  
  /**
   * Applies ultra chaos mode effects
   * 
   * @returns {void}
   */
  private applyUltraChaosMode(): void {
    if (document.body) {
      safelyModifyClass(document.body, 'chaos-mode', true);
      safelyModifyClass(document.body, 'ultra-chaos-mode', true);
      this.startUltraChaosAnimation();
      this.updateChaosFontSizes();
    }
  }
  
  /**
   * Saves the current click count to localStorage
   * 
   * @returns {void}
   */
  private saveClickCount(): void {
    try {
      localStorage.setItem('chaosClickCount', this.state.clickCount.toString());
    } catch (error) {
      console.error('Error storing chaosClickCount in localStorage:', error);
    }
  }
  
  /**
   * Handle global click events
   * Side effects: Updates state, modifies DOM, stores in localStorage
   * 
   * @param {MouseEvent} event - The click event
   * @returns {void}
   */
  private handleGlobalClick = (event: MouseEvent): void => {
    // Check if click target is a navigation element to avoid breaking navigation
    const target = event.target as Element;
    const isNavigationElement = 
      target.tagName === 'A' || 
      target.tagName === 'BUTTON' || 
      !!target.closest('a') || 
      !!target.closest('button');
    
    // Increment click count
    this.state.clickCount++;
    
    // Store updated click count in localStorage
    this.saveClickCount();
    
    // Check if we need to activate chaos mode
    if (this.state.clickCount >= DEFAULT_CONFIG.chaosThreshold && !this.state.chaosMode) {
      this.state.chaosMode = true;
      this.applyChaosMode();
    }
    
    // If already in chaos mode, toggle theme and update font sizes
    if (this.state.chaosMode) {
      toggleTheme();
      this.updateChaosFontSizes();
    }
    
    // Check if we need to activate ultra chaos mode
    if (this.state.clickCount >= DEFAULT_CONFIG.ultraChaosThreshold && !this.state.ultraChaosMode) {
      this.state.ultraChaosMode = true;
      this.applyUltraChaosMode();
      this.addBrutalistGlitchText();
    }
    
    // Apply obfuscation on click in ultra chaos mode (but not for navigation elements)
    if (this.state.ultraChaosMode && !isNavigationElement) {
      this.applyObfuscationEffect();
    }
  };
  
  /**
   * Applies random obfuscation effect to elements near mouse
   * Side effects: Modifies DOM text content temporarily
   * 
   * @returns {void}
   */
  private applyObfuscationEffect(): void {
    const now = Date.now();
    // Limit obfuscation to once per second to prevent overload
    if (now - this.state.lastObfuscationTime > DEFAULT_CONFIG.obfuscationDelay) {
      this.state.lastObfuscationTime = now;
      
      // Apply random obfuscation to nearby text
      const nearbyElements = findElementsNearPosition(
        this.state.mouseX, 
        this.state.mouseY, 
        DEFAULT_CONFIG.effectRadius
      );
      
      if (nearbyElements.length > 0) {
        const selector = nearbyElements.join(', ');
        obfuscateElements(selector);
        
        // Restore original text after a delay
        setTimeout(() => {
          restoreElements(selector);
        }, 1500);
      }
    }
  }

  /**
   * Handle mouse movement to update font sizes in chaos mode
   * Side effects: Updates state and potentially modifies DOM
   * 
   * @param {MouseEvent} event - The mouse move event
   * @returns {void}
   */
  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.state.chaosMode) return;
    
    this.state.mouseX = event.clientX;
    this.state.mouseY = event.clientY;
    
    // Only run the font resizing when in chaos mode
    requestAnimationFrame(() => this.updateChaosFontSizes());
  };

  /**
   * Update font sizes based on mouse position in chaos mode
   * Side effects: Modifies DOM styling directly
   * 
   * @returns {void}
   */
  private updateChaosFontSizes = (): void => {
    if (!this.state.chaosMode) return;
    
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
          this.state.mouseX, 
          this.state.mouseY, 
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
          if (this.state.ultraChaosMode) {
            const rotationAmount = (1 - normalizedDistance) * 45; // Up to 45 degrees rotation
            el.style.transform = `rotate(${rotationAmount}deg)`;
          }
        } else {
          // Elements far from the mouse get smaller (down to 5px)
          el.style.fontSize = '5px';
          
          // In ultra chaos mode, reset rotation for far elements
          if (this.state.ultraChaosMode) {
            el.style.transform = 'rotate(0deg)';
          }
        }
      });
    } catch (error) {
      console.error('Error updating font sizes:', error);
    }
  };

  /**
   * Start animation for ultra chaos mode
   * Side effects: Sets up an animation loop that modifies DOM properties
   * 
   * @returns {void}
   */
  private startUltraChaosAnimation = (): void => {
    // Only continue if we're in ultra chaos mode
    if (!this.state.ultraChaosMode) return;
    
    // Animate body rotation and hue
    const animateUltraChaos = (): void => {
      if (!this.state.ultraChaosMode) return;
      
      try {
        // Slowly increase rotation and reset at 360
        this.state.rotation = (this.state.rotation + 0.5) % 360;
        this.state.hueRotation = (this.state.hueRotation + 2) % 360;
        
        // Apply skew and hue-rotate filters to the entire page
        if (document.body) {
          document.body.style.transform = `skew(${Math.sin(this.state.rotation * Math.PI / 180) * 5}deg)`;
        }
        
        if (document.documentElement) {
          document.documentElement.style.filter = `hue-rotate(${this.state.hueRotation}deg)`;
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

  /**
   * Add brutalist glitch text overlay for ultra chaos mode
   * Side effects: Creates and appends DOM elements
   * 
   * @returns {void}
   */
  private addBrutalistGlitchText = (): void => {
    // Only continue if we're in ultra chaos mode
    if (!this.state.ultraChaosMode || !document.body) return;
    
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
}

// Create and initialize a single instance of ChaosMode for the page
let chaosModeInstance: ChaosMode | null = null;

/**
 * Initialize chaos mode when the document is ready
 * This is the public API for starting chaos mode
 */
export const initChaosMode = (): void => {
  if (typeof window === 'undefined') return;
  
  // Create the instance if it doesn't exist
  if (!chaosModeInstance) {
    chaosModeInstance = new ChaosMode();
  }
  
  // Initialize it
  chaosModeInstance.initialize();
};

// Initialize chaos mode when the document is ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initChaosMode);
  
  // If the document is already loaded, initialize immediately
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initChaosMode();
  }
}