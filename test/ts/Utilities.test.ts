/**
 * Tests for src/scripts/ui/features/ChaosMode/Utils/utilities.ts against the
 * real jsdom document.
 */

import {
  safelyModifyClass,
  calculateDistance,
  isElementVisible,
  isChaosDisabledByUser,
  toggleTheme,
  findElementsNearPosition,
} from '../../src/scripts/ui/features/ChaosMode/Utils/utilities';

/** Gives an element a fixed layout box; jsdom does no layout of its own. */
const placeAt = (element: Element, box: { top: number; left: number; width: number; height: number }): void => {
  const rect = {
    ...box,
    right: box.left + box.width,
    bottom: box.top + box.height,
    x: box.left,
    y: box.top,
    toJSON: () => ({}),
  } as DOMRect;
  jest.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect);
};

describe('ChaosMode Utilities', () => {
  describe('safelyModifyClass', () => {
    test('adds a class to an element', () => {
      const element = document.createElement('div');
      safelyModifyClass(element, 'test-class', true);
      expect(element.classList.contains('test-class')).toBe(true);
    });

    test('removes a class from an element', () => {
      const element = document.createElement('div');
      element.classList.add('test-class');
      safelyModifyClass(element, 'test-class', false);
      expect(element.classList.contains('test-class')).toBe(false);
    });

    test('handles null elements gracefully', () => {
      expect(() => safelyModifyClass(null, 'test-class', true)).not.toThrow();
    });
  });

  test('calculateDistance calculates Euclidean distance correctly', () => {
    expect(calculateDistance(0, 0, 3, 4)).toBe(5);
    expect(calculateDistance(1, 1, 1, 1)).toBe(0);
    expect(calculateDistance(-1, -1, 2, 3)).toBe(5);
  });

  describe('isElementVisible', () => {
    test('is true for an element inside the viewport', () => {
      const element = document.createElement('p');
      placeAt(element, { top: 10, left: 0, width: 100, height: 20 });
      expect(isElementVisible(element)).toBe(true);
    });

    test('is false for an element below the viewport', () => {
      const element = document.createElement('p');
      placeAt(element, { top: window.innerHeight + 1, left: 0, width: 100, height: 20 });
      expect(isElementVisible(element)).toBe(false);
    });

    test('is false for an element scrolled above the viewport', () => {
      const element = document.createElement('p');
      placeAt(element, { top: -200, left: 0, width: 100, height: 20 });
      expect(isElementVisible(element)).toBe(false);
    });
  });

  describe('isChaosDisabledByUser', () => {
    test('is true only when the Settings panel stored "disabled"', () => {
      expect(isChaosDisabledByUser()).toBe(false);
      localStorage.setItem('chaosMode', 'enabled');
      expect(isChaosDisabledByUser()).toBe(false);
      localStorage.setItem('chaosMode', 'disabled');
      expect(isChaosDisabledByUser()).toBe(true);
    });
  });

  test('toggleTheme toggles the dark class and stores the theme', () => {
    toggleTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    toggleTheme();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  describe('findElementsNearPosition', () => {
    test('returns a selector for each text element within the radius', () => {
      document.body.innerHTML = '<p id="near">a</p><h1 class="far away">b</h1><span>c</span>';
      placeAt(document.getElementById('near')!, { top: 0, left: 0, width: 100, height: 100 });
      placeAt(document.querySelector('h1')!, { top: 1000, left: 1000, width: 100, height: 100 });
      placeAt(document.querySelector('span')!, { top: 40, left: 40, width: 20, height: 20 });

      expect(findElementsNearPosition(50, 50, 100)).toEqual(['#near', 'span']);
    });

    test('uses the class list when an element has no id', () => {
      document.body.innerHTML = '<h1 class="far away">b</h1>';
      placeAt(document.querySelector('h1')!, { top: 0, left: 0, width: 10, height: 10 });

      expect(findElementsNearPosition(0, 0, 100)).toEqual(['.far.away']);
    });

    test('returns an empty list when nothing is near', () => {
      document.body.innerHTML = '<p>a</p>';
      placeAt(document.querySelector('p')!, { top: 5000, left: 5000, width: 10, height: 10 });

      expect(findElementsNearPosition(0, 0, 100)).toEqual([]);
    });
  });
});
