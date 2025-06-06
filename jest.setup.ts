import { jest, describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';

// Setup browser environment for testing
if (typeof window === 'undefined') {
  // @ts-ignore
  global.window = {};
}

// Add Jest globals to global scope
// @ts-ignore - Ignore type incompatibility issues with Jest globals
global.jest = jest;
// @ts-ignore
global.describe = describe;
// @ts-ignore
global.expect = expect;
// @ts-ignore
global.test = test;
// @ts-ignore
global.beforeEach = beforeEach;
// @ts-ignore
global.afterEach = afterEach;

// Mock for IntersectionObserver
class MockIntersectionObserver {
  root = null;
  rootMargin = '0px';
  thresholds = [0];
  
  callback;
  elements;

  constructor(callback) {
    this.callback = callback;
    this.elements = new Set();
  }

  observe(element) {
    this.elements.add(element);
  }

  unobserve(element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  takeRecords() {
    return [];
  }

  // Method to simulate intersection events for testing
  simulateIntersection(entries) {
    this.callback(entries, this);
  }
}

// Set up global mocks before running tests
// @ts-ignore
global.IntersectionObserver = MockIntersectionObserver;

// Create a consistent storage implementation
const createMockStorage = (initialData = {}) => {
  const store = { ...initialData };
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => {
        delete store[key];
      });
    }),
    key: jest.fn(idx => Object.keys(store)[idx] || null),
    get length() {
      return Object.keys(store).length;
    }
  };
};

// Default storage initial values for testing
const defaultStorageData = {
  'theme': 'light',
  'chaosMode': 'disabled',
  'obfuscator': 'disabled',
  'contentHighlight': 'enabled',
  'chaosClickCount': '0'
};

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: createMockStorage(defaultStorageData),
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: query === '(prefers-color-scheme: dark)' ? false : false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Create a proper mock element
const createMockElement = () => {
  const element = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    getAttribute: jest.fn(),
    setAttribute: jest.fn(),
    hasAttribute: jest.fn().mockReturnValue(false),
    removeAttribute: jest.fn(),
    getBoundingClientRect: jest.fn().mockReturnValue({
      top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({})
    }),
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn().mockReturnValue(false),
      toggle: jest.fn(),
      replace: jest.fn(),
      supports: jest.fn(),
      value: '',
      item: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
      [Symbol.iterator]: jest.fn(),
      length: 0
    },
    style: {
      fontSize: '',
      color: '',
      getPropertyValue: jest.fn(),
      setProperty: jest.fn(),
      removeProperty: jest.fn()
    },
    tagName: 'DIV',
    id: '',
    className: '',
    children: [],
    childNodes: [],
    parentNode: null,
    innerHTML: '',
    innerText: '',
    textContent: ''
  };
  return element;
};

// Create HTML and BODY elements
const htmlElement = createMockElement();
htmlElement.tagName = 'HTML';

const bodyElement = createMockElement();
bodyElement.tagName = 'BODY';

// Create document if it doesn't exist
if (typeof document === 'undefined') {
  // @ts-ignore
  global.document = {
    documentElement: htmlElement,
    body: bodyElement,
    getElementById: jest.fn().mockImplementation((id) => {
      const elem = createMockElement();
      elem.id = id;
      return elem;
    }),
    querySelector: jest.fn().mockImplementation((selector) => {
      const elem = createMockElement();
      return elem;
    }),
    querySelectorAll: jest.fn().mockImplementation(() => {
      const elements = [createMockElement(), createMockElement()];
      elements.forEach = jest.fn((callback) => elements.map(callback));
      return elements;
    }),
    createElement: jest.fn().mockImplementation((tag) => {
      const elem = createMockElement();
      elem.tagName = tag.toUpperCase();
      return elem;
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    readyState: 'complete',
    location: {
      href: 'https://localhost/',
      origin: 'https://localhost',
      protocol: 'https:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: '',
      hash: ''
    },
    cookie: ''
  };
} else {
  // For environments where document exists (like jsdom) but methods need to be mocked
  // Create a backup of the real documentElement to restore later if needed
  const originalDocumentElement = document.documentElement;
  
  // Create a workaround for the documentElement property
  // This is the key fix - instead of trying to modify the read-only property,
  // we create a configurable mock that mimics the documentElement
  const mockHtmlElement = document.createElement('html');
  
  try {
    // Try to redefine document.documentElement to make it writable in tests
    // This is the CRUCIAL fix for the "Cannot set property documentElement" error
    Object.defineProperty(document, 'documentElement', {
      value: mockHtmlElement,
      writable: true,
      configurable: true
    });
    console.log('Successfully mocked document.documentElement for testing');
  } catch (e) {
    console.warn('Could not redefine document.documentElement, some tests may fail:', e);
    
    // If we can't redefine documentElement, create a proxy to intercept operations
    if (typeof originalDocumentElement !== 'undefined') {
      // Add mock methods to the actual documentElement
      if (originalDocumentElement.classList) {
        jest.spyOn(originalDocumentElement.classList, 'add').mockImplementation(() => {});
        jest.spyOn(originalDocumentElement.classList, 'remove').mockImplementation(() => {});
        jest.spyOn(originalDocumentElement.classList, 'contains').mockImplementation(() => false);
        jest.spyOn(originalDocumentElement.classList, 'toggle').mockImplementation(() => false);
      }
    }
  }
  
  // Also fix body in the same way
  try {
    const mockBodyElement = document.createElement('body');
    
    Object.defineProperty(document, 'body', {
      value: mockBodyElement,
      writable: true,
      configurable: true
    });
  } catch (e) {
    console.warn('Could not redefine document.body, some tests may fail:', e);
  }
  
  // Mock document methods if they exist
  if (document.getElementById) {
    jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      const elem = createMockElement();
      elem.id = id;
      return elem;
    });
  }
  
  if (document.querySelector) {
    jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
      const elem = createMockElement();
      return elem;
    });
  }
  
  if (document.querySelectorAll) {
    jest.spyOn(document, 'querySelectorAll').mockImplementation(() => {
      const elements = [createMockElement(), createMockElement()];
      elements.forEach = jest.fn((callback) => elements.map(callback));
      return elements;
    });
  }
  
  // Add any missing document methods
  document.createElement = document.createElement || jest.fn().mockImplementation((tag) => {
    const elem = createMockElement();
    elem.tagName = tag.toUpperCase();
    return elem;
  });
  
  document.addEventListener = document.addEventListener || jest.fn();
  document.removeEventListener = document.removeEventListener || jest.fn();
  document.dispatchEvent = document.dispatchEvent || jest.fn();
}

// Setup window dimensions for screen-related tests
Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true });
Object.defineProperty(window, 'scrollBy', { value: jest.fn(), writable: true });

// Mock global.fetch for testing
// @ts-ignore
if (!global.fetch || global.fetch === undefined) {
  // @ts-ignore
  global.fetch = jest.fn().mockImplementation(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  }));
}

// Mock window.history
if (typeof window.history === 'undefined') {
  // @ts-ignore
  window.history = {
    back: jest.fn(),
    forward: jest.fn(),
    go: jest.fn(),
    pushState: jest.fn(),
    replaceState: jest.fn(),
    length: 0,
    scrollRestoration: 'auto',
    state: null,
  };
}

// Mock requestAnimationFrame
if (typeof window.requestAnimationFrame === 'undefined') {
  window.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 0));
  window.cancelAnimationFrame = jest.fn();
}

// Add missing functions to global namespace
if (global.URL) {
  global.URL.createObjectURL = global.URL.createObjectURL || jest.fn();
  global.URL.revokeObjectURL = global.URL.revokeObjectURL || jest.fn();
}

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});