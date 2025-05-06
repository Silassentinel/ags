import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';
import { initNavMenu, toggleNavMenu } from '../src/scripts/ui/Menu.js';

describe('Menu Module', () => {
  beforeEach(() => {
    // Setup DOM for testing
    document.body = document.createElement('body');
    
    // Create hamburger menu
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger';
    document.body.appendChild(hamburger);
    
    // Create nav links
    const navLinks = document.createElement('div');
    navLinks.className = 'nav-links';
    document.body.appendChild(navLinks);
    
    // Create back button
    const goBackButton = document.createElement('button');
    goBackButton.className = 'goBack';
    document.body.appendChild(goBackButton);
    
    // Mock window.history.back
    window.history.back = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('initNavMenu adds event listeners to hamburger and back button', () => {
    // Spy on addEventListener
    const hamburger = document.querySelector('.hamburger');
    const goBackButton = document.querySelector('.goBack');
    
    // Add null checks before spying
    if (hamburger && goBackButton) {
      // @ts-ignore - Type issues with jest.spyOn
      const hamburgerSpy = jest.spyOn(hamburger, 'addEventListener');
      // @ts-ignore - Type issues with jest.spyOn
      const goBackSpy = jest.spyOn(goBackButton, 'addEventListener');
      
      // Initialize nav menu
      initNavMenu();
      
      // Check that event listeners were added
      expect(hamburgerSpy).toHaveBeenCalledWith('click', toggleNavMenu);
      expect(goBackSpy).toHaveBeenCalledWith('click', expect.any(Function));
    } else {
      fail('Menu elements not found');
    }
  });
  
  test('toggleNavMenu toggles expanded class on nav-links', () => {
    // Get nav links element
    const navLinks = document.querySelector('.nav-links');
    
    if (navLinks) {
      // Toggle menu
      toggleNavMenu();
      
      // Check if expanded class was added
      expect(navLinks.classList.contains('expanded')).toBeTruthy();
      
      // Toggle menu again
      toggleNavMenu();
      
      // Check if expanded class was removed
      expect(navLinks.classList.contains('expanded')).toBeFalsy();
    } else {
      fail('Nav links element not found');
    }
  });
  
  test('goBack button calls window.history.back', () => {
    // Initialize nav menu
    initNavMenu();
    
    // Get back button
    const goBackButton = document.querySelector('.goBack');
    
    if (goBackButton) {
      // Simulate click on back button
      // @ts-ignore - HTMLElement might not have click method in strict TypeScript
      goBackButton.click();
      
      // Check if window.history.back was called
      expect(window.history.back).toHaveBeenCalled();
    } else {
      fail('Go back button not found');
    }
  });
});