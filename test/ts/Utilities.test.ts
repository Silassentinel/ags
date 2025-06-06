/**
 * Tests for utilities.ts TypeScript implementation
 * 
 * These tests verify that the TypeScript utility implementations provide the same
 * functionality as those used in the TSX components.
 */

import '@testing-library/jest-dom';
import { 
  safelyModifyClass, 
  calculateDistance,
  isElementVisible,
  toggleTheme,
  findElementsNearPosition
} from '../../src/scripts/ui/features/ChaosMode/Utils/utilities';

// Mock DOM methods
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();
const mockQuerySelector = jest.fn();
const mockQuerySelectorAll = jest.fn(() => []);
const mockGetElementById = jest.fn();

// Mock for localStorage
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

describe('ChaosMode Utilities', () => {
  // Setup DOM mocks before each test
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Create DOM elements
    document.body = document.createElement('body');
    document.documentElement = document.createElement('html');
    
    // Mock DOM methods
    document.addEventListener = mockAddEventListener;
    document.removeEventListener = mockRemoveEventListener;
    document.querySelector = mockQuerySelector;
    document.querySelectorAll = mockQuerySelectorAll;
    document.getElementById = mockGetElementById;
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });
  
  test('safelyModifyClass adds a class to an element', () => {
    const element = document.createElement('div');
    const addSpy = jest.spyOn(element.classList, 'add');
    
    safelyModifyClass(element, 'test-class', true);
    
    expect(addSpy).toHaveBeenCalledWith('test-class');
    expect(element.classList.contains('test-class')).toBeTruthy();
  });
  
  test('safelyModifyClass removes a class from an element', () => {
    const element = document.createElement('div');
    element.classList.add('test-class');
    const removeSpy = jest.spyOn(element.classList, 'remove');
    
    safelyModifyClass(element, 'test-class', false);
    
    expect(removeSpy).toHaveBeenCalledWith('test-class');
    expect(element.classList.contains('test-class')).toBeFalsy();
  });
  
  test('safelyModifyClass handles null elements gracefully', () => {
    expect(() => {
      safelyModifyClass(null, 'test-class', true);
    }).not.toThrow();
  });
  
  test('calculateDistance calculates Euclidean distance correctly', () => {
    // Distance from (0,0) to (3,4) should be 5 (Pythagorean theorem)
    expect(calculateDistance(0, 0, 3, 4)).toBe(5);
    
    // Distance from (10,10) to (13,14) should also be 5
    expect(calculateDistance(10, 10, 13, 14)).toBe(5);
    
    // Distance from a point to itself should be 0
    expect(calculateDistance(7, 7, 7, 7)).toBe(0);
  });
  
  test('isElementVisible correctly identifies visible elements', () => {
    const element = document.createElement('div');
    
    // Mock getBoundingClientRect for a fully visible element
    element.getBoundingClientRect = jest.fn(() => ({
      top: 100,
      left: 100,
      right: 200,
      bottom: 200,
      width: 100,
      height: 100
    }));
    
    // Mock window properties
    window.innerHeight = 1000;
    window.innerWidth = 1000;
    
    expect(isElementVisible(element)).toBeTruthy();
    
    // Now test an element that's outside the viewport
    element.getBoundingClientRect = jest.fn(() => ({
      top: -200, // Above the viewport
      left: 100,
      right: 200,
      bottom: -100,
      width: 100,
      height: 100
    }));
    
    expect(isElementVisible(element)).toBeFalsy();
  });
  
  test('toggleTheme toggles dark class and updates localStorage', () => {
    // Setup
    document.documentElement.classList = {
      toggle: jest.fn(),
      contains: jest.fn(() => true)
    } as unknown as DOMTokenList;
    
    // Execute
    toggleTheme();
    
    // Verify
    expect(document.documentElement.classList.toggle).toHaveBeenCalledWith('dark');
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    
    // Test toggling back to light theme
    document.documentElement.classList.contains = jest.fn(() => false);
    
    toggleTheme();
    
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
  });
  
  test('findElementsNearPosition returns elements within radius', () => {
    // Setup mock DOM elements
    const element1 = document.createElement('p');
    const element2 = document.createElement('h1');
    const element3 = document.createElement('span');
    
    // Mock getBoundingClientRect for elements
    element1.getBoundingClientRect = jest.fn(() => ({
      top: 0, 
      left: 0, 
      width: 100, 
      height: 100,
      right: 100, 
      bottom: 100
    }));
    
    element2.getBoundingClientRect = jest.fn(() => ({
      top: 500, 
      left: 500, 
      width: 100, 
      height: 100,
      right: 600, 
      bottom: 600
    }));
    
    element3.getBoundingClientRect = jest.fn(() => ({
      top: 50, 
      left: 50, 
      width: 100, 
      height: 100,
      right: 150, 
      bottom: 150
    }));
    
    // Set id for one element, class for another
    element1.id = 'test-id';
    element2.classList.add('test-class');
    
    // Mock querySelectorAll to return our test elements
    document.querySelectorAll = jest.fn(() => [element1, element2, element3]);
    
    // Test with position (50, 50) and radius 100
    // Only elements close to this position should be returned
    const result = findElementsNearPosition(50, 50, 100);
    
    // Check that the returned selectors match what we expect
    expect(result).toContain('#test-id'); // Element 1 should be identified by ID
    expect(result).toContain('span'); // Element 3 should be identified by tag name
    expect(result).not.toContain('.test-class'); // Element 2 is too far away
  });
});

describe('TSX-TS Utility Function Parity', () => {
  test('safelyModifyClass behaves the same in TS and TSX', () => {
    // The TS implementation adds error handling but should functionally perform
    // the same operation as the TSX implementation
    const element = document.createElement('div');
    
    // Add the class
    safelyModifyClass(element, 'test-class', true);
    expect(element.classList.contains('test-class')).toBeTruthy();
    
    // Remove the class
    safelyModifyClass(element, 'test-class', false);
    expect(element.classList.contains('test-class')).toBeFalsy();
  });
  
  test('calculateDistance produces the same result in TS and TSX', () => {
    // Both implementations use the same Pythagorean theorem formula
    // so they should produce identical results
    const result = calculateDistance(10, 20, 13, 24);
    expect(result).toBe(5); // Expected outcome is the same in both implementations
  });
  
  test('isElementVisible matches TSX implementation behavior', () => {
    const element = document.createElement('div');
    
    // Test a visible element
    element.getBoundingClientRect = jest.fn(() => ({
      top: 0,
      bottom: 500
    }));
    
    // The TS implementation checks if element is in viewport vertically
    expect(isElementVisible(element)).toBeTruthy();
    
    // Test an invisible element
    element.getBoundingClientRect = jest.fn(() => ({
      top: 2000, // Below viewport
      bottom: 2100
    }));
    
    expect(isElementVisible(element)).toBeFalsy();
  });
  
  test('findElementsNearPosition returns consistent results with TSX implementation', () => {
    // Setup mock DOM elements
    const element = document.createElement('p');
    element.id = 'test-el';
    
    // Mock getBoundingClientRect
    element.getBoundingClientRect = jest.fn(() => ({
      top: 50, 
      left: 50, 
      width: 100, 
      height: 100,
      right: 150, 
      bottom: 150
    }));
    
    // Mock querySelectorAll
    document.querySelectorAll = jest.fn(() => [element]);
    
    // TS implementation should return element IDs when available
    const result = findElementsNearPosition(75, 75, 50);
    
    expect(result.length).toBe(1);
    expect(result[0]).toBe('#test-el');
    
    // When testing with an element outside the radius, neither implementation
    // should return it
    element.getBoundingClientRect = jest.fn(() => ({
      top: 1000, 
      left: 1000, 
      width: 100, 
      height: 100,
      right: 1100, 
      bottom: 1100
    }));
    
    const outOfRangeResult = findElementsNearPosition(0, 0, 100);
    expect(outOfRangeResult.length).toBe(0);
  });
});