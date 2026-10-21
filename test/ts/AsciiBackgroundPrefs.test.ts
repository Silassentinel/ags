/**
 * Tests for the ASCII backdrop preferences
 * (src/scripts/ui/features/AsciiBackground/prefs.ts).
 */

import {
  DEFAULT_INTENSITY,
  MAX_OPACITY,
  STORAGE_ENABLED,
  STORAGE_INTENSITY,
  clampIntensity,
  opacityFor,
  prefersReducedMotion,
  readEnabled,
  readIntensity,
  writeEnabled,
  writeIntensity,
} from '../../src/scripts/ui/features/AsciiBackground/prefs';

describe('clampIntensity', () => {
  test('keeps integers between 0 and 100', () => {
    expect(clampIntensity(0)).toBe(0);
    expect(clampIntensity(55)).toBe(55);
    expect(clampIntensity(100)).toBe(100);
  });

  test('clamps, rounds and parses strings', () => {
    expect(clampIntensity(-10)).toBe(0);
    expect(clampIntensity(140)).toBe(100);
    expect(clampIntensity(33.6)).toBe(34);
    expect(clampIntensity('80')).toBe(80);
  });

  test('falls back to the default for garbage', () => {
    expect(clampIntensity('loud')).toBe(DEFAULT_INTENSITY);
    expect(clampIntensity(undefined)).toBe(DEFAULT_INTENSITY);
    expect(clampIntensity(NaN)).toBe(DEFAULT_INTENSITY);
  });
});

describe('stored preferences', () => {
  test('the backdrop is on unless the visitor switched it off', () => {
    expect(readEnabled()).toBe(true);
    localStorage.setItem(STORAGE_ENABLED, 'enabled');
    expect(readEnabled()).toBe(true);
    localStorage.setItem(STORAGE_ENABLED, 'disabled');
    expect(readEnabled()).toBe(false);
  });

  test('without a stored choice, reduced motion turns the backdrop off; a stored choice wins', () => {
    expect(readEnabled(localStorage, true)).toBe(false);
    expect(readEnabled(localStorage, false)).toBe(true);
    localStorage.setItem(STORAGE_ENABLED, 'enabled');
    expect(readEnabled(localStorage, true)).toBe(true);
    localStorage.setItem(STORAGE_ENABLED, 'disabled');
    expect(readEnabled(localStorage, false)).toBe(false);
  });

  test('prefersReducedMotion follows the media query', () => {
    expect(prefersReducedMotion()).toBe(false);
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
    expect(prefersReducedMotion()).toBe(true);
    expect(readEnabled()).toBe(false);
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({ matches: false, media: query, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  });

  test('writeEnabled stores the switch', () => {
    writeEnabled(false);
    expect(localStorage.getItem(STORAGE_ENABLED)).toBe('disabled');
    writeEnabled(true);
    expect(localStorage.getItem(STORAGE_ENABLED)).toBe('enabled');
  });

  test('the intensity defaults, round-trips and survives garbage', () => {
    expect(readIntensity()).toBe(DEFAULT_INTENSITY);
    writeIntensity(80);
    expect(localStorage.getItem(STORAGE_INTENSITY)).toBe('80');
    expect(readIntensity()).toBe(80);
    writeIntensity(250);
    expect(readIntensity()).toBe(100);
    localStorage.setItem(STORAGE_INTENSITY, 'very');
    expect(readIntensity()).toBe(DEFAULT_INTENSITY);
  });

  test('a throwing storage is tolerated', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readEnabled(broken, false)).toBe(true);
    expect(readIntensity(broken)).toBe(DEFAULT_INTENSITY);
    expect(() => writeEnabled(false, broken)).not.toThrow();
    expect(() => writeIntensity(10, broken)).not.toThrow();
  });
});

describe('opacityFor', () => {
  test('scales linearly in light mode up to the cap', () => {
    expect(opacityFor(0, false)).toBe(0);
    expect(opacityFor(30, false)).toBe(0.18);
    expect(opacityFor(50, false)).toBe(0.3);
    expect(opacityFor(100, false)).toBe(MAX_OPACITY);
  });

  test('is boosted but capped in dark mode', () => {
    expect(opacityFor(30, true)).toBe(0.27);
    expect(opacityFor(100, true)).toBe(MAX_OPACITY);
    expect(opacityFor(0, true)).toBe(0);
  });
});
