/**
 * ChaosMode.js - A script to create chaos when users click on the page too much
 */

// Import obfuscator functionality
import { obfuscateElements, restoreElements } from './Obfuscator.js';

// Initialize click counter from localStorage
let clickCount = parseInt(localStorage.getItem('chaosClickCount') || '0');

// Track chaos mode states based on click count
let chaosMode = clickCount >= 5;
let ultraChaosMode = clickCount >= 25;

// Initialize mouse position tracking
let mouseX = 0;
let mouseY = 0;

// Track rotation for ultra chaos mode
let rotation = 0;
let hueRotation = 0;

// Track for text obfuscation
let lastObfuscationTime = 0;

/**
 * Initialize the chaos mode functionality
 */
const initChaosMode = () => {
  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('mousemove', handleMouseMove);
  
  // Apply appropriate chaos mode immediately based on click count
  if (ultraChaosMode) {
    document.body.classList.add('chaos-mode');
    document.body.classList.add('ultra-chaos-mode');
    startUltraChaosAnimation();
    // Update font sizes based on initial mouse position
    updateChaosFontSizes();
  } else if (chaosMode) {
    document.body.classList.add('chaos-mode');
    // Update font sizes based on initial mouse position
    updateChaosFontSizes();
  }
};

/**
 * Handle global click events
 */
const handleGlobalClick = (event) => {
  // Don't increment for clicks on links and buttons to ensure navigation still works
  const target = event.target;
  const isNavigationElement = 
    target.tagName === 'A' || 
    target.tagName === 'BUTTON' || 
    target.closest('a') || 
    target.closest('button');
  
  // Still count clicks on navigation elements, but don't prevent default behavior
  clickCount++;
  
  // Store updated click count in localStorage
  localStorage.setItem('chaosClickCount', clickCount.toString());
  
  // Log the current click count (for debugging)
  console.log(`Click count: ${clickCount}`);
  
  // Check if we need to activate chaos mode
  if (clickCount >= 5) {
    chaosMode = true;
    
    // Apply font size chaos effect (handled by CSS classes)
    if (!document.body.classList.contains('chaos-mode')) {
      document.body.classList.add('chaos-mode');
    }
    
    // On each click beyond the threshold, toggle between dark and light mode
    toggleTheme();
    
    // Update font sizes based on mouse position
    updateChaosFontSizes();
  }
  
  // Check if we need to activate ultra chaos mode
  if (clickCount >= 25 && !ultraChaosMode) {
    ultraChaosMode = true;
    document.body.classList.add('ultra-chaos-mode');
    startUltraChaosAnimation();
    
    // Add brutalist glitch text
    addBrutalistGlitchText();
  }
  
  // Apply obfuscation on click in ultra chaos mode
  if (ultraChaosMode && !isNavigationElement) {
    const now = Date.now();
    // Limit obfuscation to once per second to prevent overload
    if (now - lastObfuscationTime > 1000) {
      lastObfuscationTime = now;
      
      // Apply random obfuscation to nearby text
      const nearbyElements = findElementsNearMouse(mouseX, mouseY, 300);
      if (nearbyElements.length > 0) {
        obfuscateElements(nearbyElements.join(', '));
        
        // Restore original text after a delay
        setTimeout(() => {
          restoreElements(nearbyElements.join(', '));
        }, 1500);
      }
    }
  }
};

/**
 * Handle mouse movement to update font sizes in chaos mode
 */
const handleMouseMove = (event) => {
  if (!chaosMode) return;
  
  mouseX = event.clientX;
  mouseY = event.clientY;
  
  // Only run the font resizing when in chaos mode
  if (chaosMode) {
    requestAnimationFrame(updateChaosFontSizes);
  }
};

/**
 * Toggle between light and dark theme
 */
const toggleTheme = () => {
  const element = document.documentElement;
  element.classList.toggle("dark");

  const isDark = element.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
};

/**
 * Update font sizes based on mouse position in chaos mode
 */
const updateChaosFontSizes = () => {
  if (!chaosMode) return;
  
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li, blockquote');
  
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const elementCenterX = rect.left + rect.width / 2;
    const elementCenterY = rect.top + rect.height / 2;
    
    // Calculate distance from mouse to element center
    const distance = Math.sqrt(
      Math.pow(mouseX - elementCenterX, 2) + 
      Math.pow(mouseY - elementCenterY, 2)
    );
    
    // The closer to the mouse, the larger the font
    // Adjust the "droplet" effect parameters here
    const dropletRadius = 200; // Size of the "droplet" effect area
    
    if (distance < dropletRadius) {
      // Elements close to the mouse get larger (up to 50px font size)
      const normalizedDistance = distance / dropletRadius;
      const fontSize = 50 - (normalizedDistance * 45); // 50px at mouse, down to normal size at the edge
      el.style.fontSize = `${fontSize}px`;
      
      // In ultra chaos mode, also add rotation based on distance
      if (ultraChaosMode) {
        const rotationAmount = (1 - normalizedDistance) * 45; // Up to 45 degrees rotation
        el.style.transform = `rotate(${rotationAmount}deg)`;
      }
    } else {
      // Elements far from the mouse get smaller (down to 5px)
      el.style.fontSize = '5px';
      
      // In ultra chaos mode, reset rotation for far elements
      if (ultraChaosMode) {
        el.style.transform = 'rotate(0deg)';
      }
    }
  });
};

/**
 * Start animation for ultra chaos mode
 */
const startUltraChaosAnimation = () => {
  // Only continue if we're in ultra chaos mode
  if (!ultraChaosMode) return;
  
  // Animate body rotation and hue
  function animateUltraChaos() {
    if (!ultraChaosMode) return;
    
    // Slowly increase rotation and reset at 360
    rotation = (rotation + 0.5) % 360;
    hueRotation = (hueRotation + 2) % 360;
    
    // Apply skew and hue-rotate filters to the entire page
    document.body.style.transform = `skew(${Math.sin(rotation * Math.PI / 180) * 5}deg)`;
    document.documentElement.style.filter = `hue-rotate(${hueRotation}deg)`;
    
    // Apply random border widths to brutalist elements
    const brutalistElements = document.querySelectorAll('.brutalist-card, blockquote, .brutalist-intro, .brutalist-grid, .brutalist-section-title');
    
    brutalistElements.forEach(el => {
      // Only change borders every 20 frames to avoid too much flickering
      if (Math.random() < 0.05) {
        const borderWidth = Math.floor(Math.random() * 15) + 2; // 2-16px border
        el.style.borderWidth = `${borderWidth}px`;
      }
    });
    
    // Continue animation
    requestAnimationFrame(animateUltraChaos);
  }
  
  // Start the animation loop
  animateUltraChaos();
};

/**
 * Add brutalist glitch text overlay for ultra chaos mode
 */
const addBrutalistGlitchText = () => {
  // Only continue if we're in ultra chaos mode
  if (!ultraChaosMode) return;
  
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
    if (Math.random() < 0.1) {
      document.body.classList.toggle('glitch-effect');
      setTimeout(() => document.body.classList.toggle('glitch-effect'), 100);
    }
  }, 1000);
};

/**
 * Find elements near the mouse position
 * @param {number} x - Mouse X position
 * @param {number} y - Mouse Y position
 * @param {number} radius - Radius to search within
 * @returns {string[]} - Array of selectors for elements near the mouse
 */
const findElementsNearMouse = (x, y, radius) => {
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, li');
  const nearbyElements = [];
  
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const distance = Math.sqrt(
      Math.pow(x - centerX, 2) + 
      Math.pow(y - centerY, 2)
    );
    
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
};

// Initialize chaos mode when the document is ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initChaosMode);
}

// If the document is already loaded, initialize immediately
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initChaosMode();
}