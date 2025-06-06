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
  
  test('toggleNavMenu toggles expanded class on nav-links element', () => {
    // Get the nav links element
    const navLinks = document.querySelector('.nav-links');
    
    // Mock the classList toggle method
    navLinks!.classList.toggle = jest.fn();
    
    // Call toggleNavMenu
    toggleNavMenu();
    
    // Should toggle the 'expanded' class on the nav-links element
    expect(navLinks!.classList.toggle).toHaveBeenCalledWith('expanded');
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
  
  test('DOMContentLoaded event initializes the menu', () => {
    // Mock document.addEventListener
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = jest.fn();
    
    // Load the Menu module
    const spy = jest.spyOn(document, 'addEventListener');
    
    // Check if the event listener was registered for DOMContentLoaded
    expect(spy).toHaveBeenCalledWith('DOMContentLoaded', initNavMenu);
    
    // Clean up
    document.addEventListener = originalAddEventListener;
  });
});