/**
 * Tests for src/scripts/ui/Theme.ts against the real jsdom document.
 */

import { initTheme, handleToggleClick } from '../../src/scripts/ui/Theme';

/** Makes window.matchMedia report the given system colour-scheme preference. */
const systemPrefersDark = (dark: boolean): void => {
  (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
    matches: dark && query === '(prefers-color-scheme: dark)',
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));
};

const isDark = (): boolean => document.documentElement.classList.contains('dark');

describe('Theme Management', () => {
  beforeEach(() => {
    systemPrefersDark(false);
    document.body.innerHTML = '<button id="themeToggle">theme</button>';
  });

  test('initTheme applies a stored dark theme', () => {
    localStorage.setItem('theme', 'dark');
    initTheme();
    expect(isDark()).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  test('initTheme applies a stored light theme', () => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'light');
    initTheme();
    expect(isDark()).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('initTheme follows the system preference when nothing is stored', () => {
    systemPrefersDark(true);
    initTheme();
    expect(isDark()).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  test('initTheme defaults to light when nothing is stored or preferred', () => {
    initTheme();
    expect(isDark()).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('initTheme wires the toggle button so clicks flip the theme', () => {
    initTheme();
    const button = document.getElementById('themeToggle') as HTMLButtonElement;
    button.click();
    expect(isDark()).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    button.click();
    expect(isDark()).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('the toggle button reports its pressed state', () => {
    initTheme();
    const button = document.getElementById('themeToggle') as HTMLButtonElement;
    expect(button.getAttribute('aria-pressed')).toBe('false');
    button.click();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  test('initTheme tolerates a page without a toggle button', () => {
    document.body.innerHTML = '';
    expect(() => initTheme()).not.toThrow();
  });

  test('handleToggleClick flips the class and stores the result', () => {
    handleToggleClick();
    expect(isDark()).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    handleToggleClick();
    expect(isDark()).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
