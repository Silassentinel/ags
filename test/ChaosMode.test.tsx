import { h } from 'preact';
import { render, fireEvent } from '@testing-library/preact';
import '@testing-library/jest-dom';
import ChaosMode from '../src/components/features/ChaosMode/ChaosMode';
import { 
  safelyModifyClass, 
  calculateDistance,
  findElementsNearPosition
} from '../src/scripts/ui/features/ChaosMode/Utils/utilities';

// Mock the window/document objects
const mockAddEventListener = jest.fn();
const mockQuerySelector = jest.fn();
const mockQuerySelectorAll = jest.fn();
const mockGetElementById = jest.fn();

// Mock localStorage
const getItemMock = jest.spyOn(window.localStorage, 'getItem');
const setItemMock = jest.spyOn(window.localStorage, 'setItem');

describe('ChaosMode Component', () => {
  beforeEach(() => {
    // Setup DOM for testing
    // @ts-ignore - Needed to bypass readonly property
    document.documentElement = document.createElement('html');
    document.body = document.createElement('body');
    
    // Mock localStorage
    localStorage.clear();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  // Test cases for ChaosMode component
});

describe('ChaosMode Utilities', () => {
  test('safelyModifyClass adds a class', () => {
    const element = document.createElement('div');
    safelyModifyClass(element, 'test-class', true);
    expect(element.classList.contains('test-class')).toBeTruthy();
  });
  
  test('safelyModifyClass removes a class', () => {
    const element = document.createElement('div');
    element.classList.add('test-class');
    safelyModifyClass(element, 'test-class', false);
    expect(element.classList.contains('test-class')).toBeFalsy();
  });
  
  test('safelyModifyClass handles null element', () => {
    // This should not throw an error
    expect(() => safelyModifyClass(null, 'test-class', true)).not.toThrow();
  });
  
  test('calculateDistance calculates correct distance between points', () => {
    // Distance between (0,0) and (3,4) should be 5 (Pythagorean theorem)
    expect(calculateDistance(0, 0, 3, 4)).toBe(5);
  });
  
  test('findElementsNearPosition finds elements within radius', () => {
    // Setup mock DOM with elements
    const element1 = document.createElement('p');
    const element2 = document.createElement('h1');
    element1.getBoundingClientRect = jest.fn().mockReturnValue({ 
      top: 0, left: 0, width: 100, height: 100 
    });
    element2.getBoundingClientRect = jest.fn().mockReturnValue({ 
      top: 1000, left: 1000, width: 100, height: 100 
    });
    
    // Mock querySelectorAll to return our test elements
    document.querySelectorAll = jest.fn().mockReturnValue([element1, element2]);
    
    // Test with position (50, 50) and radius 100
    // Only element1 should be returned as it's within radius
    const result = findElementsNearPosition(50, 50, 100);
    
    expect(result.length).toBe(1);
  });
});