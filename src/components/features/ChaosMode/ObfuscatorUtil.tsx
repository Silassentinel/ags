import { h } from 'preact';
import type { ObfuscationMethod, ObfuscationOptions, CyclicObfuscationOptions } from './types';

// Helper function to check if an element is visible in the viewport
export const isElementVisible = (element: Element): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

// Obfuscator utility functions as a static class
export class ObfuscatorUtil {
  /**
   * Collection of text obfuscation methods
   */
  private static methods = {
    /**
     * Reverses the text
     * @param text - The text to reverse
     * @returns The reversed text
     */
    reverse: (text: string): string => {
      return text.split('').reverse().join('');
    },

    /**
     * Converts text to leetspeak
     * @param text - The text to convert
     * @returns The leetspeak text
     */
    leetspeak: (text: string): string => {
      const leetMap: Record<string, string> = {
        'a': '4', 'e': '3', 'i': '1', 'o': '0', 
        's': '5', 't': '7', 'b': '8', 'l': '1',
        'A': '4', 'E': '3', 'I': '1', 'O': '0', 
        'S': '5', 'T': '7', 'B': '8', 'L': '1'
      };
      
      return text.split('').map(char => leetMap[char] || char).join('');
    },

    /**
     * Scrambles the letters in the middle of each word
     * @param text - The text to scramble
     * @returns The scrambled text
     */
    scramble: (text: string): string => {
      return text.split(' ').map(word => {
        if (word.length <= 3) return word;
        
        const first = word[0];
        const last = word[word.length - 1];
        const middle = word.substring(1, word.length - 1).split('');
        
        // Shuffle the middle characters
        for (let i = middle.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [middle[i], middle[j]] = [middle[j], middle[i]];
        }
        
        return first + middle.join('') + last;
      }).join(' ');
    },

    /**
     * Randomly capitalizes letters
     * @param text - The text to capitalize
     * @returns The text with random capitalization
     */
    randomCapitalize: (text: string): string => {
      return text.split('').map(char => 
        Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()
      ).join('');
    },

    /**
     * Inserts random zalgo characters
     * @param text - The text to zalgify
     * @param intensity - The intensity of the effect (1-3)
     * @returns The zalgified text
     */
    zalgo: (text: string, intensity: number = 1): string => {
      const zalgoMarks = [
        '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0305', '\u0306', 
        '\u0307', '\u0308', '\u0309', '\u030A', '\u030B', '\u030C', '\u030D', 
        '\u030E', '\u030F', '\u0310', '\u0311', '\u0312', '\u0313', '\u0314', 
        '\u0315', '\u031A', '\u031B', '\u033D', '\u033E', '\u033F', '\u0340', 
        '\u0341', '\u0342', '\u0343', '\u0344', '\u0346', '\u034A', '\u034B', 
        '\u034C', '\u0350', '\u0351', '\u0352', '\u0357', '\u0358', '\u035B', 
        '\u035D', '\u035E', '\u0360', '\u0361', '\u0362', '\u0363', '\u0364', 
        '\u0365', '\u0366', '\u0367', '\u0368', '\u0369', '\u036A', '\u036B', 
        '\u036C', '\u036D', '\u036E', '\u036F'
      ];
      
      return text.split('').map(char => {
        let result = char;
        const count = Math.floor(Math.random() * (5 * intensity));
        
        for (let i = 0; i < count; i++) {
          const mark = zalgoMarks[Math.floor(Math.random() * zalgoMarks.length)];
          result += mark;
        }
        
        return result;
      }).join('');
    }
  };

  /**
   * Gets a random obfuscation method
   * @returns A random method name
   */
  public static getRandomMethod(): ObfuscationMethod {
    const methods = Object.keys(this.methods) as ObfuscationMethod[];
    return methods[Math.floor(Math.random() * methods.length)];
  }

  /**
   * Main obfuscation function - picks a random method or specified one
   * @param text - The text to obfuscate
   * @param options - Obfuscation options
   * @returns The obfuscated text
   */
  public static obfuscate(text: string, options?: ObfuscationOptions): string {
    if (!text) return text;
    
    const method = options?.method || this.getRandomMethod();
    const intensity = options?.intensity || 1;
    
    if (method === 'zalgo') {
      return this.methods.zalgo(text, intensity);
    }
    
    return this.methods[method]?.(text) || text;
  }

  /**
   * Apply obfuscation to elements matching a selector
   * Side effects: Modifies DOM text content
   * 
   * @param selector - CSS selector for elements to obfuscate
   * @param options - Obfuscation options
   */
  public static obfuscateElements(selector: string, options: ObfuscationOptions = { onlyVisible: true }): void {
    if (typeof window === 'undefined') return;
    
    try {
      const elements = document.querySelectorAll(selector);
      if (!elements || elements.length === 0) return;
      
      elements.forEach(element => {
        // Skip processing if element is not visible and onlyVisible is true
        if (options.onlyVisible && !isElementVisible(element)) {
          return;
        }
        
        // Cast to HTMLElement to access dataset property
        if (!(element instanceof HTMLElement)) return;
        
        // Save original text if it hasn't been saved yet
        if (!element.dataset.originalText && element.textContent) {
          element.dataset.originalText = element.textContent;
        }
        
        // Obfuscate the text
        if (element.textContent && element.dataset.originalText) {
          element.textContent = this.obfuscate(element.dataset.originalText, options);
        }
      });
    } catch (error) {
      console.error(`Error obfuscating elements with selector "${selector}":`, error);
    }
  }

  /**
   * Restore original text to elements
   * Side effects: Modifies DOM text content
   * 
   * @param selector - CSS selector for elements to restore
   */
  public static restoreElements(selector: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      const elements = document.querySelectorAll(selector);
      if (!elements || elements.length === 0) return;
      
      elements.forEach(element => {
        // Cast to HTMLElement to access dataset property
        if (!(element instanceof HTMLElement)) return;
        
        if (element.dataset.originalText) {
          element.textContent = element.dataset.originalText;
        }
      });
    } catch (error) {
      console.error(`Error restoring elements with selector "${selector}":`, error);
    }
  }

  /**
   * Gradually obfuscate text over time, cycling through methods
   * Side effects: Sets up timers and modifies DOM text content
   * 
   * @param selector - CSS selector for elements to obfuscate
   * @param options - Cyclic obfuscation options
   * @returns Function to stop the cyclic obfuscation
   */
  public static cyclicObfuscation(
    selector: string, 
    options: CyclicObfuscationOptions = {}
  ): () => void {
    if (typeof window === 'undefined') return () => {};
    
    const methods = Object.keys(this.methods) as ObfuscationMethod[];
    let currentIndex = 0;
    let startTime = Date.now();
    let timeoutId: number | null = null;
    
    const interval = options.interval || 2000;
    const duration = options.duration || 0;
    
    const cycle = (): void => {
      const method = methods[currentIndex];
      this.obfuscateElements(selector, { ...options, method });
      
      currentIndex = (currentIndex + 1) % methods.length;
      
      // Check if we should continue
      if (duration === 0 || Date.now() - startTime < duration) {
        timeoutId = window.setTimeout(cycle, interval);
      } else {
        this.restoreElements(selector);
      }
    };
    
    // Start the cycle
    cycle();
    
    // Return a function to stop the cycle
    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        this.restoreElements(selector);
      }
    };
  }
}

// Simple component that integrates with chaos mode
export const ObfuscatorComponent = () => {
  // This component doesn't render anything, it just provides functionality
  return null;
}

export default ObfuscatorComponent;