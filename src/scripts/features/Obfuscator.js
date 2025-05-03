/**
 * Obfuscator.js - A script to obfuscate text on the website
 * Can be used independently or with ChaosMode.js for enhanced chaos
 */

// Collection of obfuscation methods
const obfuscationMethods = {
  /**
   * Reverses the text
   * @param {string} text - The text to reverse
   * @returns {string} - The reversed text
   */
  reverse: (text) => {
    return text.split('').reverse().join('');
  },

  /**
   * Converts text to leetspeak
   * @param {string} text - The text to convert
   * @returns {string} - The leetspeak text
   */
  leetspeak: (text) => {
    const leetMap = {
      'a': '4', 'e': '3', 'i': '1', 'o': '0', 
      's': '5', 't': '7', 'b': '8', 'l': '1',
      'A': '4', 'E': '3', 'I': '1', 'O': '0', 
      'S': '5', 'T': '7', 'B': '8', 'L': '1'
    };
    
    return text.split('').map(char => leetMap[char] || char).join('');
  },

  /**
   * Scrambles the letters in the middle of each word
   * @param {string} text - The text to scramble
   * @returns {string} - The scrambled text
   */
  scramble: (text) => {
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
   * @param {string} text - The text to capitalize
   * @returns {string} - The text with random capitalization
   */
  randomCapitalize: (text) => {
    return text.split('').map(char => 
      Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()
    ).join('');
  },

  /**
   * Inserts random zalgo characters
   * @param {string} text - The text to zalgify
   * @param {number} intensity - The intensity of the effect (1-3)
   * @returns {string} - The zalgified text
   */
  zalgo: (text, intensity = 1) => {
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

// Main obfuscation function - picks a random method or specified one
const obfuscate = (text, method = null) => {
  if (!text) return text;
  
  const methods = Object.keys(obfuscationMethods);
  const selectedMethod = method || methods[Math.floor(Math.random() * methods.length)];
  
  if (obfuscationMethods[selectedMethod]) {
    return obfuscationMethods[selectedMethod](text);
  }
  
  return text;
};

/**
 * Apply obfuscation to elements matching a selector
 * @param {string} selector - CSS selector for elements to obfuscate
 * @param {string} method - (Optional) Specific obfuscation method to use
 * @param {boolean} onlyVisible - Only obfuscate visible elements
 */
const obfuscateElements = (selector, method = null, onlyVisible = true) => {
  const elements = document.querySelectorAll(selector);
  
  elements.forEach(element => {
    // Skip processing if element is not visible and onlyVisible is true
    if (onlyVisible) {
      const rect = element.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) {
        return;
      }
    }
    
    // Save original text if it hasn't been saved yet
    if (!element.dataset.originalText) {
      element.dataset.originalText = element.textContent;
    }
    
    // Obfuscate the text
    element.textContent = obfuscate(element.dataset.originalText, method);
  });
};

/**
 * Restore original text to elements
 * @param {string} selector - CSS selector for elements to restore
 */
const restoreElements = (selector) => {
  const elements = document.querySelectorAll(selector);
  
  elements.forEach(element => {
    if (element.dataset.originalText) {
      element.textContent = element.dataset.originalText;
    }
  });
};

/**
 * Gradually obfuscate text over time, cycling through methods
 * @param {string} selector - CSS selector for elements to obfuscate
 * @param {number} interval - Interval between obfuscations in ms
 * @param {number} duration - Total duration to run in ms, or 0 for infinite
 */
const cyclicObfuscation = (selector, interval = 2000, duration = 0) => {
  const methods = Object.keys(obfuscationMethods);
  let currentIndex = 0;
  let startTime = Date.now();
  
  const cycle = () => {
    const method = methods[currentIndex];
    obfuscateElements(selector, method);
    
    currentIndex = (currentIndex + 1) % methods.length;
    
    // Check if we should continue
    if (duration === 0 || Date.now() - startTime < duration) {
      setTimeout(cycle, interval);
    } else {
      restoreElements(selector);
    }
  };
  
  // Start the cycle
  cycle();
};

// Integrate with chaos mode if it exists
const integrateChaosMode = () => {
  if (typeof window === 'undefined') return;
  
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', () => {
    // Check if we're in chaos mode
    const checkChaosState = () => {
      const clickCount = parseInt(localStorage.getItem('chaosClickCount') || '0');
      
      // When in ultra chaos mode, occasionally obfuscate all text
      if (clickCount >= 25) {
        // Apply obfuscation to paragraphs and headings
        if (Math.random() < 0.3) { // 30% chance of obfuscation
          const selector = 'p, h1, h2, h3, h4, h5, h6';
          const method = Object.keys(obfuscationMethods)[Math.floor(Math.random() * Object.keys(obfuscationMethods).length)];
          obfuscateElements(selector, method);
          
          // Restore after a short delay
          setTimeout(() => {
            restoreElements(selector);
          }, 2000);
        }
      }
    };
    
    // Check every few seconds
    setInterval(checkChaosState, 5000);
    
    // Check on document click
    document.addEventListener('click', () => {
      // Higher chance of obfuscation on click
      const clickCount = parseInt(localStorage.getItem('chaosClickCount') || '0');
      if (clickCount >= 25 && Math.random() < 0.5) {
        const selector = 'p, h1, h2, h3, h4, h5, h6';
        obfuscateElements(selector, 'zalgo');
        
        setTimeout(() => {
          restoreElements(selector);
        }, 1500);
      }
    });
  });
};

// Initialize the obfuscator
integrateChaosMode();

// Export for use in other scripts
export {
  obfuscate,
  obfuscateElements,
  restoreElements,
  cyclicObfuscation
};