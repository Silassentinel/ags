import { h } from 'preact';
import { render, act } from '@testing-library/preact';
import '@testing-library/jest-dom';
import Theme from '../src/components/ui/Theme';

describe('Theme Component', () => {
  beforeEach(() => {
    // Setup DOM for testing
    // @ts-ignore - Needed to bypass readonly property
    document.documentElement = document.createElement('html');
    document.body = document.createElement('body');
    
    // Create theme toggle button
    const themeToggle = document.createElement('button');
    themeToggle.id = 'themeToggle';
    document.body.appendChild(themeToggle);
    
    // Clear localStorage
    localStorage.clear();
    
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('initializes with light theme by default', () => {
    // Mock matchMedia to return false for dark mode
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    
    // Render the component
    render(h(Theme, {}));
    
    // Check that dark class is not present
    expect(document.documentElement.classList.contains('dark')).toBeFalsy();
    
    // Check that localStorage was set to light
    expect(localStorage.getItem('theme')).toBe('light');
  });
  
  test('initializes with dark theme based on system preference', () => {
    // Mock matchMedia to return true for dark mode
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    
    // Render the component
    render(h(Theme, {}));
    
    // Check that dark class is present
    expect(document.documentElement.classList.contains('dark')).toBeTruthy();
    
    // Check that localStorage was set to dark
    expect(localStorage.getItem('theme')).toBe('dark');
  });
  
  test('initializes with theme from localStorage if available', () => {
    // Set theme in localStorage
    localStorage.setItem('theme', 'dark');
    
    // Mock matchMedia to return false for dark mode
    // This tests that localStorage takes precedence over system preference
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    
    // Render the component
    render(h(Theme, {}));
    
    // Check that dark class is present (from localStorage)
    expect(document.documentElement.classList.contains('dark')).toBeTruthy();
  });
  
  test('adds event listeners to the theme toggle button', () => {
    // Spy on addEventListener
    const themeToggle = document.getElementById('themeToggle');
    // Make sure themeToggle is not null before spying
    if (themeToggle) {
      // @ts-ignore - Type issues with jest.spyOn
      const addEventListenerSpy = jest.spyOn(themeToggle, 'addEventListener');
      
      // Render the component
      render(h(Theme, {}));
      
      // Check that addEventListener was called for both events
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
    } else {
      throw new Error('Theme toggle button not found');
    }
  });
  
  test('theme toggle button click toggles the theme', () => {
    // Start with light theme
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    
    // Render the component
    render(h(Theme, {}));
    
    // Get the theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    
    // Make sure themeToggle is not null before dispatching events
    if (themeToggle) {
      // Mock the click event with preventDefault
      const clickEvent = new MouseEvent('click');
      Object.defineProperty(clickEvent, 'preventDefault', { value: jest.fn() });
      
      // Dispatch the click event
      act(() => {
        themeToggle.dispatchEvent(clickEvent);
      });
      
      // Check that the theme was toggled to dark
      expect(document.documentElement.classList.contains('dark')).toBeTruthy();
      expect(localStorage.getItem('theme')).toBe('dark');
      
      // Dispatch another click event
      act(() => {
        themeToggle.dispatchEvent(clickEvent);
      });
      
      // Check that the theme was toggled back to light
      expect(document.documentElement.classList.contains('dark')).toBeFalsy();
      expect(localStorage.getItem('theme')).toBe('light');
    } else {
      throw new Error('Theme toggle button not found');
    }
  });
});