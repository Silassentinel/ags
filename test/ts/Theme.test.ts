/**
 * Tests for Theme.ts TypeScript implementation
 * 
 * These tests verify the theme detection and switching functionality.
 */

import '@testing-library/jest-dom';
import { initTheme } from '../../src/scripts/ui/Theme';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Mock window.matchMedia
const matchMediaMock = jest.fn();

describe('Theme Management', () => {
  // Setup DOM mocks before each test
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Instead of trying to replace document.documentElement, 
    // we'll mock its classList methods
    if (document.documentElement) {
      // Mock classList methods on the existing documentElement
      document.documentElement.classList = {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
        toggle: jest.fn().mockReturnValue(true),
        replace: jest.fn(),
        supports: jest.fn(),
        toString: jest.fn(),
        value: '',
        item: jest.fn(),
        forEach: jest.fn(),
        entries: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
        length: 0
      } as unknown as DOMTokenList;
    }
    
    // Create theme toggle button for testing
    const themeToggle = document.createElement('button');
    themeToggle.id = 'themeToggle';
    document.body.appendChild(themeToggle);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Mock window.matchMedia
    window.matchMedia = matchMediaMock;
  });
  
  test('initTheme sets theme based on localStorage if available', () => {
    // Mock localStorage to return 'dark'
    localStorageMock.getItem.mockReturnValueOnce('dark');
    
    // Call initTheme
    initTheme();
    
    // Should add dark class to documentElement
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    
    // Theme should be stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
  
  test('initTheme sets light theme based on localStorage if available', () => {
    // Mock localStorage to return 'light'
    localStorageMock.getItem.mockReturnValueOnce('light');
    
    // Call initTheme
    initTheme();
    
    // Should remove dark class from documentElement
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    
    // Theme should be stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });
  
  test('initTheme uses system preference when localStorage is not available', () => {
    // Mock localStorage to return null (no stored theme)
    localStorageMock.getItem.mockReturnValueOnce(null);
    
    // Mock matchMedia to indicate dark mode preference
    matchMediaMock.mockReturnValueOnce({ matches: true });
    
    // Call initTheme
    initTheme();
    
    // Should add dark class to documentElement
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
    
    // Theme should be stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
  
  test('initTheme defaults to light theme when no preference is found', () => {
    // Mock localStorage to return null (no stored theme)
    localStorageMock.getItem.mockReturnValueOnce(null);
    
    // Mock matchMedia to indicate no dark mode preference
    matchMediaMock.mockReturnValueOnce({ matches: false });
    
    // Call initTheme
    initTheme();
    
    // Should remove dark class from documentElement
    expect(document.documentElement.classList.remove).toHaveBeenCalledWith('dark');
    
    // Theme should be stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
  });
  
  test('initTheme adds event listener to themeToggle button', () => {
    // Get the theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    
    // Mock addEventListener
    themeToggle!.addEventListener = jest.fn();
    
    // Call initTheme
    initTheme();
    
    // Should add click event listener to themeToggle button
    expect(themeToggle!.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
  
  test('handleToggleClick toggles theme when button is clicked', () => {
    // Test the toggle functionality
    // Mock contains to return false first (light theme)
    (document.documentElement.classList.contains as jest.Mock).mockReturnValue(false);
    
    // Get the theme toggle button
    const themeToggle = document.getElementById('themeToggle')!;
    
    // Replace addEventListener with our own implementation to capture the handler
    let clickHandler: Function;
    themeToggle.addEventListener = jest.fn((event, handler) => {
      if (event === 'click') clickHandler = handler;
    });
    
    // Call initTheme to set up event listeners
    initTheme();
    
    // Create a mock event with preventDefault method
    const mockEvent = {
      preventDefault: jest.fn()
    };
    
    // Call the click handler
    clickHandler(mockEvent);
    
    // Should call preventDefault
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    
    // Should toggle the dark class
    expect(document.documentElement.classList.toggle).toHaveBeenCalledWith('dark');
  });
});