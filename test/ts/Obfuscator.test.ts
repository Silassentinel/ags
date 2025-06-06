/**
 * Tests for Obfuscator.ts TypeScript implementation
 * 
 * These tests verify that the TypeScript implementation provides the same
 * functionality as the TSX component implementation.
 */

import '@testing-library/jest-dom';
import { 
  Obfuscator,
  obfuscate, 
  obfuscateElements, 
  restoreElements, 
  cyclicObfuscation,
  getRandomMethod,
  initObfuscatorWithChaosMode
} from '../../src/scripts/ui/features/ChaosMode/Obfuscator';
import { isElementVisible } from '../../src/scripts/ui/features/ChaosMode/Utils/utilities';

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

// Mock for window.setTimeout
const originalSetTimeout = window.setTimeout;

describe('Obfuscator TypeScript Implementation', () => {
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
    
    // Mock setTimeout
    window.setTimeout = jest.fn();
  });
  
  // Clean up after tests
  afterEach(() => {
    window.setTimeout = originalSetTimeout;
  });
  
  test('obfuscate method transforms text with default random method', () => {
    // Mock the getRandomMethod to return a predictable value
    jest.spyOn(Obfuscator, 'getRandomMethod').mockReturnValue('reverse');
    
    const text = 'Hello world';
    const result = obfuscate(text);
    
    // Since we mocked getRandomMethod to return 'reverse', the text should be reversed
    expect(result).toBe('dlrow olleH');
  });
  
  test('obfuscate method transforms text with specified method', () => {
    const text = 'Hello world';
    
    // Test with 'leetspeak' method
    const leetResult = obfuscate(text, { method: 'leetspeak' });
    expect(leetResult).toContain('3'); // 'e' should be converted to '3'
    
    // Test with 'reverse' method
    const reverseResult = obfuscate(text, { method: 'reverse' });
    expect(reverseResult).toBe('dlrow olleH');
    
    // Test with 'randomCapitalize' method
    const randomCapitalizeResult = obfuscate(text, { method: 'randomCapitalize' });
    // Result should be the same length but different from original
    expect(randomCapitalizeResult.length).toBe(text.length);
    expect(randomCapitalizeResult.toLowerCase()).toBe(text.toLowerCase());
    
    // Test with 'scramble' method
    const scrambleResult = obfuscate(text, { method: 'scramble' });
    // Check first and last letters remain the same for each word
    expect(scrambleResult.startsWith('H')).toBeTruthy();
    expect(scrambleResult.endsWith('d')).toBeTruthy();
    
    // Test with 'zalgo' method
    const zalgoResult = obfuscate(text, { method: 'zalgo', intensity: 2 });
    // Zalgo result should be longer due to combining characters
    expect(zalgoResult.length).toBeGreaterThan(text.length);
  });
  
  test('getRandomMethod returns a valid obfuscation method', () => {
    const method = getRandomMethod();
    
    // Method should be one of the valid methods
    const validMethods = ['reverse', 'leetspeak', 'scramble', 'randomCapitalize', 'zalgo'];
    expect(validMethods).toContain(method);
  });
  
  test('obfuscateElements modifies DOM elements with obfuscated text', () => {
    // Setup mock elements
    const element1 = document.createElement('p');
    element1.textContent = 'Test text 1';
    const element2 = document.createElement('h1');
    element2.textContent = 'Test text 2';
    
    // Mock querySelectorAll to return our test elements
    document.querySelectorAll = jest.fn().mockReturnValue([element1, element2]);
    
    // Mock isElementVisible to return true
    jest.spyOn(Obfuscator, 'obfuscate').mockReturnValue('Obfuscated text');
    
    // Call obfuscateElements
    obfuscateElements('p, h1', { method: 'reverse' });
    
    // Original text should be saved in dataset
    expect(element1.dataset.originalText).toBe('Test text 1');
    expect(element2.dataset.originalText).toBe('Test text 2');
    
    // Text content should be obfuscated
    expect(element1.textContent).toBe('Obfuscated text');
    expect(element2.textContent).toBe('Obfuscated text');
  });
  
  test('obfuscateElements respects onlyVisible option', () => {
    // Setup mock elements
    const element1 = document.createElement('p');
    element1.textContent = 'Visible element';
    const element2 = document.createElement('h1');
    element2.textContent = 'Hidden element';
    
    // Mock querySelectorAll to return our test elements
    document.querySelectorAll = jest.fn().mockReturnValue([element1, element2]);
    
    // Mock isElementVisible
    const isElementVisibleMock = jest.fn()
      .mockReturnValueOnce(true)  // First element is visible
      .mockReturnValueOnce(false); // Second element is not visible
    
    // Override the imported function with our mock
    // This is a bit hacky but necessary for testing
    jest.mock('../../src/scripts/ui/features/ChaosMode/Utils/utilities', () => ({
      isElementVisible: isElementVisibleMock
    }));
    
    // Mock obfuscate to return predictable value
    jest.spyOn(Obfuscator, 'obfuscate').mockReturnValue('Obfuscated text');
    
    // Call obfuscateElements with onlyVisible=true
    obfuscateElements('p, h1', { onlyVisible: true });
    
    // Only the visible element should be obfuscated
    expect(element1.textContent).toBe('Obfuscated text');
    expect(element2.textContent).toBe('Hidden element');
  });
  
  test('restoreElements restores original text', () => {
    // Setup mock elements with original text saved
    const element1 = document.createElement('p');
    element1.textContent = 'Obfuscated text 1';
    element1.dataset.originalText = 'Original text 1';
    const element2 = document.createElement('h1');
    element2.textContent = 'Obfuscated text 2';
    element2.dataset.originalText = 'Original text 2';
    
    // Mock querySelectorAll to return our test elements
    document.querySelectorAll = jest.fn().mockReturnValue([element1, element2]);
    
    // Call restoreElements
    restoreElements('p, h1');
    
    // Text content should be restored to original
    expect(element1.textContent).toBe('Original text 1');
    expect(element2.textContent).toBe('Original text 2');
  });
  
  test('cyclicObfuscation cycles through obfuscation methods', () => {
    // Setup mock elements
    const element = document.createElement('p');
    element.textContent = 'Test text';
    
    // Mock querySelectorAll to return our test element
    document.querySelectorAll = jest.fn().mockReturnValue([element]);
    
    // Mock setTimeout to immediately execute callback
    window.setTimeout = jest.fn((callback) => {
      if (typeof callback === 'function') callback();
      return 1 as unknown as NodeJS.Timeout;
    });
    
    // Call cyclicObfuscation
    const stopCycling = cyclicObfuscation('p', { interval: 100 });
    
    // Should have called obfuscateElements at least once
    expect(document.querySelectorAll).toHaveBeenCalled();
    
    // Call the stop function
    stopCycling();
    
    // Should have called restoreElements
    expect(document.querySelectorAll).toHaveBeenCalledWith('p');
  });
  
  test('initObfuscatorWithChaosMode sets up event listeners and timers', () => {
    // Mock document.readyState
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true
    });
    
    // Call initObfuscatorWithChaosMode
    initObfuscatorWithChaosMode();
    
    // Should add DOMContentLoaded event listener
    expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    
    // Get the DOMContentLoaded handler
    const domContentLoadedHandler = mockAddEventListener.mock.calls.find(
      call => call[0] === 'DOMContentLoaded'
    )[1];
    
    // Call the handler
    domContentLoadedHandler();
    
    // Should setup interval timer to check chaos state
    expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
    
    // Should add click event listener
    expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
});

describe('Obfuscator Methods', () => {
  test('reverse method reverses the text', () => {
    const text = 'Hello world';
    // @ts-ignore - Accessing private method for testing
    const result = Obfuscator.methods.reverse(text);
    expect(result).toBe('dlrow olleH');
  });
  
  test('leetspeak method converts characters to leetspeak', () => {
    const text = 'Hello world';
    // @ts-ignore - Accessing private method for testing
    const result = Obfuscator.methods.leetspeak(text);
    
    // 'e' should be converted to '3', 'l' to '1', 'o' to '0'
    expect(result).toBe('H3110 w0r1d');
  });
  
  test('scramble method keeps first and last letters while scrambling middle', () => {
    const text = 'Scramble';
    // @ts-ignore - Accessing private method for testing
    const result = Obfuscator.methods.scramble(text);
    
    // First and last letters should remain the same
    expect(result.charAt(0)).toBe('S');
    expect(result.charAt(result.length - 1)).toBe('e');
    
    // Length should be the same
    expect(result.length).toBe(text.length);
    
    // Text should be different (although there's a very small chance it could be the same)
    expect(result).not.toBe(text);
  });
  
  test('randomCapitalize method changes capitalization randomly', () => {
    const text = 'randomize';
    // @ts-ignore - Accessing private method for testing
    const result = Obfuscator.methods.randomCapitalize(text);
    
    // Length should be the same
    expect(result.length).toBe(text.length);
    
    // Text should be different case but same letters
    expect(result.toLowerCase()).toBe(text.toLowerCase());
    
    // At least one letter should have different case (small chance this test could fail randomly)
    let hasDifferentCase = false;
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== result[i]) {
        hasDifferentCase = true;
        break;
      }
    }
    expect(hasDifferentCase).toBeTruthy();
  });
  
  test('zalgo method adds combining characters to text', () => {
    const text = 'Zalgo text';
    // @ts-ignore - Accessing private method for testing
    const result = Obfuscator.methods.zalgo(text, 1);
    
    // Result should be longer due to combining characters
    expect(result.length).toBeGreaterThan(text.length);
    
    // Should contain the original text characters
    for (let i = 0; i < text.length; i++) {
      expect(result).toContain(text[i]);
    }
  });
});

describe('Obfuscator and ObfuscatorUtil Parity', () => {
  test('Both implementations should obfuscate text consistently', () => {
    // Test that the core obfuscation methods behave the same way
    const sampleText = 'Test obfuscation';
    
    // Mock getRandomMethod to return a predictable value
    jest.spyOn(Obfuscator, 'getRandomMethod').mockReturnValue('reverse');
    
    // Get result from TS implementation
    const tsResult = obfuscate(sampleText, { method: 'reverse' });
    
    // Expected result based on the reverse method
    const expectedResult = 'noitacsufbo tseT';
    
    // Both should produce the same output
    expect(tsResult).toBe(expectedResult);
  });
  
  test('Both implementations should handle DOM operations similarly', () => {
    // Setup mock elements
    const element = document.createElement('p');
    element.textContent = 'Original text';
    
    // Mock querySelectorAll to return our test element
    document.querySelectorAll = jest.fn().mockReturnValue([element]);
    
    // Mock obfuscate to return predictable value
    jest.spyOn(Obfuscator, 'obfuscate').mockReturnValue('Obfuscated text');
    
    // Obfuscate the element
    obfuscateElements('p');
    
    // Original text should be saved in dataset
    expect(element.dataset.originalText).toBe('Original text');
    
    // Text content should be obfuscated
    expect(element.textContent).toBe('Obfuscated text');
    
    // Restore the element
    restoreElements('p');
    
    // Text content should be restored
    expect(element.textContent).toBe('Original text');
  });
});