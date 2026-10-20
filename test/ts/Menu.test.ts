/**
 * Tests for Menu.ts TypeScript implementation
 * 
 * These tests verify the navigation menu functionality.
 */

import '@testing-library/jest-dom';
import { initNavMenu, toggleNavMenu } from '../../src/scripts/ui/Menu';

describe('Navigation Menu Management', () => {
  // Setup DOM elements before each test
  beforeEach(() => {
    // Reset DOM
    document.body = document.createElement('body');
    
    // Create hamburger button
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger';
    document.body.appendChild(hamburger);
    
    // Create go back button
    const goBackButton = document.createElement('button');
    goBackButton.className = 'goBack';
    document.body.appendChild(goBackButton);
    
    // Create nav links container
    const navLinks = document.createElement('div');
    navLinks.className = 'nav-links';
    document.body.appendChild(navLinks);
    
    // Mock window.history
    window.history.back = jest.fn();
  });
  
  test('initNavMenu adds event listeners to hamburger and back buttons', () => {
    // Get the hamburger and back buttons
    const hamburger = document.querySelector('.hamburger');
    const goBackButton = document.querySelector('.goBack');
    
    // Mock the addEventListener method
    hamburger!.addEventListener = jest.fn();
    goBackButton!.addEventListener = jest.fn();
    
    // Call initNavMenu
    initNavMenu();
    
    // Should add click event listener to hamburger button that calls toggleNavMenu
    expect(hamburger!.addEventListener).toHaveBeenCalledWith('click', toggleNavMenu);
    
    // Should add click event listener to back button
    expect(goBackButton!.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
  
  test('toggleNavMenu toggles the expanded class and the button state', () => {
    const navLinks = document.querySelector('.nav-links')!;
    const hamburger = document.querySelector('.hamburger')!;

    toggleNavMenu();
    expect(navLinks.classList.contains('expanded')).toBe(true);
    expect(hamburger.getAttribute('aria-expanded')).toBe('true');

    toggleNavMenu();
    expect(navLinks.classList.contains('expanded')).toBe(false);
    expect(hamburger.getAttribute('aria-expanded')).toBe('false');
  });

  test('Escape closes an open menu and returns focus to the hamburger', () => {
    const cleanup = initNavMenu();
    const hamburger = document.querySelector('.hamburger') as HTMLButtonElement;
    toggleNavMenu();
    expect(hamburger.getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(document.querySelector('.nav-links')!.classList.contains('expanded')).toBe(false);
    expect(hamburger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(hamburger);
    cleanup();
  });
  
  test('clicking back button calls window.history.back()', () => {
    // Get the back button
    const goBackButton = document.querySelector('.goBack');
    
    // Capture the click handler
    let clickHandler: Function;
    goBackButton!.addEventListener = jest.fn((event, handler) => {
      if (event === 'click') clickHandler = handler;
    });
    
    // Call initNavMenu to set up event listeners
    initNavMenu();
    
    // Call the back button click handler
    clickHandler();
    
    // Should call window.history.back()
    expect(window.history.back).toHaveBeenCalled();
  });
});
