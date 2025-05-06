import '@testing-library/jest-dom';
import { 
  obfuscate, 
  obfuscateElements, 
  restoreElements, 
  cyclicObfuscation,
  Obfuscator 
} from '../src/scripts/ui/features/ChaosMode/Obfuscator';

// Mock DOM for testing
const mockQuerySelector = jest.fn();
const mockQuerySelectorAll = jest.fn();

describe('Obfuscator', () => {
  beforeEach(() => {
    // Setup DOM mocks
    document.querySelector = mockQuerySelector;
    document.querySelectorAll = mockQuerySelectorAll;
    
    // Reset mock implementations
    mockQuerySelector.mockReset();
    mockQuerySelectorAll.mockReset();
    
    // Create a mock body for testing
    document.body = document.createElement('body');
    
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });
  
  test('obfuscate handles reverse method correctly', () => {
    const text = 'hello world';
    const result = obfuscate(text, { method: 'reverse' });
    
    expect(result).toBe('dlrow olleh');
  });
  
  test('obfuscate handles leetspeak method correctly', () => {
    const text = 'hello world';
    const result = obfuscate(text, { method: 'leetspeak' });
    
    // Expected: some letters should be replaced with numbers/symbols
    // We'll check for some common leetspeak substitutions
    expect(result).not.toBe(text);
    expect(result).toMatch(/[034517]/); // Common leetspeak chars
  });
  
  test('obfuscate handles randomCapitalize method correctly', () => {
    const text = 'hello world';
    const result = obfuscate(text, { method: 'randomCapitalize' });
    
    expect(result.toLowerCase()).toBe(text);
    expect(result).not.toBe(text);
  });
  
  test('obfuscate handles zalgo method correctly', () => {
    const text = 'hello world';
    const result = obfuscate(text, { method: 'zalgo', intensity: 1 });
    
    expect(result).not.toBe(text);
    expect(result.length).toBeGreaterThan(text.length);
  });
  
  test('obfuscateElements modifies elements matching the selector', () => {
    // Setup mock elements
    const element1 = document.createElement('p');
    element1.textContent = 'Test content';
    
    const elements = [element1];
    mockQuerySelectorAll.mockReturnValue(elements);
    
    // Call the function
    obfuscateElements('p', { method: 'reverse' });
    
    // Check that dataset was used to store original text
    expect(element1.dataset.originalText).toBe('Test content');
    
    // Check that text content was modified
    expect(element1.textContent).toBe('tnetnoc tseT');
  });
  
  test('restoreElements restores original text', () => {
    // Setup mock elements
    const element1 = document.createElement('p');
    element1.textContent = 'Modified content';
    element1.dataset.originalText = 'Original content';
    
    const elements = [element1];
    mockQuerySelectorAll.mockReturnValue(elements);
    
    // Call the function
    restoreElements('p');
    
    // Check that original text was restored
    expect(element1.textContent).toBe('Original content');
  });
  
  test('cyclicObfuscation runs obfuscation at intervals', () => {
    // Setup mock elements
    const element1 = document.createElement('p');
    element1.textContent = 'Test content';
    
    const elements = [element1];
    mockQuerySelectorAll.mockReturnValue(elements);
    
    // Spy on obfuscateElements and restoreElements
    const obfuscateSpy = jest.spyOn(Obfuscator, 'obfuscateElements');
    const restoreSpy = jest.spyOn(Obfuscator, 'restoreElements');
    
    // Call cyclicObfuscation with a short interval
    const stopFn = cyclicObfuscation('p', { interval: 1000, duration: 5000 });
    
    // Advance timers
    jest.advanceTimersByTime(1000);
    
    // Check first call
    expect(obfuscateSpy).toHaveBeenCalledTimes(1);
    
    // Advance timers more
    jest.advanceTimersByTime(4000);
    
    // Check multiple calls
    expect(obfuscateSpy).toHaveBeenCalledTimes(5);
    
    // Call the stop function
    stopFn();
    
    // Check that we restored elements after stopping
    expect(restoreSpy).toHaveBeenCalledTimes(1);
  });
});