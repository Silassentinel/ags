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

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    // @ts-ignore
    getItem: jest.fn().mockImplementation(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Mock document
if (typeof document === 'undefined') {
  // @ts-ignore
  global.document = { 
    documentElement: {
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        // @ts-ignore
        contains: jest.fn().mockReturnValue(false),
        length: 0,
        value: '',
        // @ts-ignore
        item: jest.fn(),
        // @ts-ignore
        toString: jest.fn(),
        // @ts-ignore
        supports: jest.fn(),
        // @ts-ignore
        replace: jest.fn(),
        // @ts-ignore
        toggle: jest.fn(),
        // @ts-ignore
        entries: jest.fn(),
        // @ts-ignore
        forEach: jest.fn(),
        // @ts-ignore
        keys: jest.fn(),
        // @ts-ignore
        values: jest.fn(),
      }
    },
    // @ts-ignore
    getElementById: jest.fn().mockImplementation(() => null),
    // @ts-ignore
    querySelector: jest.fn().mockImplementation(() => null),
    // @ts-ignore
    querySelectorAll: jest.fn().mockImplementation(() => ({
      length: 0,
      item: () => null,
      forEach: () => {},
      [Symbol.iterator]: function* () {},
    })),
    // @ts-ignore
    createElement: jest.fn().mockImplementation(() => ({
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
      }
    }))
  };
}

// Mock global.fetch for testing
// @ts-ignore
if (typeof global.fetch === 'function') {
  // @ts-ignore
  global.fetch = jest.fn();
}

// Mock window.history
if (typeof window.history === 'undefined') {
  // @ts-ignore
  window.history = {
    back: jest.fn(),
    forward: jest.fn(),
    go: jest.fn(),
    // @ts-ignore
    pushState: jest.fn(),
    // @ts-ignore
    replaceState: jest.fn(),
    length: 0,
    scrollRestoration: 'auto',
    state: null,
  };
}