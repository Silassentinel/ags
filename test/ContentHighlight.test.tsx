import '@testing-library/jest-dom';
import { initContentHighlight } from '../src/scripts/ui/features/ContentHighlight/ContentHighlight';

// Mock Intersection Observer callbacks
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

// Store original IntersectionObserver
const OriginalIntersectionObserver = global.IntersectionObserver;

// Create a new mock implementation
global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
  const instance = new OriginalIntersectionObserver(callback);
  
  // Add our spy methods
  instance.observe = mockObserve;
  instance.unobserve = mockUnobserve;
  instance.disconnect = mockDisconnect;
  
  return instance;
});

describe('ContentHighlight', () => {
  beforeEach(() => {
    // Setup mock elements
    document.body = document.createElement('body');
    
    // Reset mocks
    mockObserve.mockClear();
    mockUnobserve.mockClear();
    mockDisconnect.mockClear();
    
    // Mock document.querySelectorAll
    document.querySelectorAll = jest.fn().mockReturnValue([]);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('initializes IntersectionObserver with correct options', () => {
    initContentHighlight();
    
    // Check that IntersectionObserver was initialized with the correct options
    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        root: null,
        rootMargin: '-20% 0px',
        threshold: 0.6
      }
    );
  });
  
  test('observes all elements with highlight-in-viewport class', () => {
    // Create mock elements
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');
    
    // Mock document.querySelectorAll to return our test elements
    document.querySelectorAll = jest.fn().mockReturnValue([element1, element2]);
    
    initContentHighlight();
    
    // Check that observe was called for each element
    expect(mockObserve).toHaveBeenCalledTimes(2);
  });
  
  test('adds content-highlighted class to intersecting elements', () => {
    // Create a mock element
    const element = document.createElement('div');
    
    // Mock document.querySelectorAll to return our test element
    document.querySelectorAll = jest.fn().mockReturnValue([element]);
    
    // Initialize content highlight and get the callback
    const observer = initContentHighlight();
    
    // Directly call the callback with intersection data
    const entries = [{
      isIntersecting: true,
      target: element
    }];
    
    // Access the callback directly from the most recent call to IntersectionObserver
    const callback = global.IntersectionObserver.mock.calls[global.IntersectionObserver.mock.calls.length - 1][0];
    callback(entries);
    
    // Check that the correct class was added
    expect(element.classList.contains('content-highlighted')).toBeTruthy();
    expect(element.classList.contains('content-darkened')).toBeFalsy();
  });
  
  test('adds content-darkened class to non-intersecting elements', () => {
    // Create a mock element
    const element = document.createElement('div');
    
    // Mock document.querySelectorAll to return our test element
    document.querySelectorAll = jest.fn().mockReturnValue([element]);
    
    // Initialize content highlight and get the callback
    const observer = initContentHighlight();
    
    // Directly call the callback with intersection data
    const entries = [{
      isIntersecting: false,
      target: element
    }];
    
    // Access the callback directly from the most recent call to IntersectionObserver
    const callback = global.IntersectionObserver.mock.calls[global.IntersectionObserver.mock.calls.length - 1][0];
    callback(entries);
    
    // Check that the correct class was added
    expect(element.classList.contains('content-darkened')).toBeTruthy();
    expect(element.classList.contains('content-highlighted')).toBeFalsy();
  });
});