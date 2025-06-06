import '@testing-library/jest-dom';
import { initContentHighlight } from '../src/scripts/ui/features/ContentHighlight/ContentHighlight';

// Setup a record to store the callback
let intersectionObserverCallback: IntersectionObserverCallback | null = null;

// Mock Intersection Observer callbacks
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

// Store original IntersectionObserver
const OriginalIntersectionObserver = global.IntersectionObserver;

// Create a new mock implementation
// @ts-ignore - Ignore type errors with Jest mock implementation
global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
  // Store the callback for later use
  intersectionObserverCallback = callback;
  
  // Create a mock instance
  return {
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
    root: null,
    rootMargin: '0px',
    thresholds: [0],
    takeRecords: () => []
  };
});

describe('ContentHighlight', () => {
  beforeEach(() => {
    // Setup mock elements
    document.body = document.createElement('body');
    
    // Reset mocks
    mockObserve.mockClear();
    mockUnobserve.mockClear();
    mockDisconnect.mockClear();
    
    // Reset callback
    intersectionObserverCallback = null;
    
    // Mock document.querySelectorAll
    // @ts-ignore - Mock implementation
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
    // @ts-ignore - Mock implementation
    document.querySelectorAll = jest.fn().mockReturnValue([element1, element2]);
    
    initContentHighlight();
    
    // Check that observe was called for each element
    expect(mockObserve).toHaveBeenCalledTimes(2);
  });
  
  test('adds content-highlighted class to intersecting elements', () => {
    // Create a mock element
    const element = document.createElement('div');
    
    // Mock document.querySelectorAll to return our test element
    // @ts-ignore - Mock implementation
    document.querySelectorAll = jest.fn().mockReturnValue([element]);
    
    // Initialize content highlight
    initContentHighlight();
    
    // Ensure we have a callback
    if (!intersectionObserverCallback) {
      fail('IntersectionObserver callback was not set');
      return;
    }
    
    // Create a more complete mock IntersectionObserverEntry
    // @ts-ignore - We need to create a partial mock that's good enough for the test
    const entries = [{
      isIntersecting: true,
      target: element,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRatio: 0.8,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now()
    }];
    
    // @ts-ignore - We only need a minimal mock observer for the test
    intersectionObserverCallback(entries, {});
    
    // Check that the correct class was added
    expect(element.classList.contains('content-highlighted')).toBeTruthy();
    expect(element.classList.contains('content-darkened')).toBeFalsy();
  });
  
  test('adds content-darkened class to non-intersecting elements', () => {
    // Create a mock element
    const element = document.createElement('div');
    
    // Mock document.querySelectorAll to return our test element
    // @ts-ignore - Mock implementation
    document.querySelectorAll = jest.fn().mockReturnValue([element]);
    
    // Initialize content highlight
    initContentHighlight();
    
    // Ensure we have a callback
    if (!intersectionObserverCallback) {
      fail('IntersectionObserver callback was not set');
      return;
    }
    
    // Create a more complete mock IntersectionObserverEntry
    // @ts-ignore - We need to create a partial mock that's good enough for the test
    const entries = [{
      isIntersecting: false,
      target: element,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRatio: 0,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: Date.now()
    }];
    
    // @ts-ignore - We only need a minimal mock observer for the test
    intersectionObserverCallback(entries, {});
    
    // Check that the correct class was added
    expect(element.classList.contains('content-darkened')).toBeTruthy();
    expect(element.classList.contains('content-highlighted')).toBeFalsy();
  });
});