import { h } from 'preact';
import { render, act } from '@testing-library/preact';
import '@testing-library/jest-dom';
import Theme from '../src/components/ui/Theme';

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

describe('Theme Component', () => {
  beforeEach(() => {
    systemPrefersDark(false);
    // The toggle button lives in the page, outside the component's own output
    const themeToggle = document.createElement('button');
    themeToggle.id = 'themeToggle';
    document.body.appendChild(themeToggle);
  });

  test('initializes with light theme by default', () => {
    render(h(Theme, {}));
    expect(isDark()).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });

  test('initializes with dark theme based on system preference', () => {
    systemPrefersDark(true);
    render(h(Theme, {}));
    expect(isDark()).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  test('initializes with theme from localStorage if available', () => {
    // localStorage takes precedence over the (light) system preference
    localStorage.setItem('theme', 'dark');
    render(h(Theme, {}));
    expect(isDark()).toBe(true);
  });

  test('adds click and touchend listeners to the theme toggle button', () => {
    const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;
    const addEventListenerSpy = jest.spyOn(themeToggle, 'addEventListener');
    render(h(Theme, {}));
    expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
  });

  test('the toggle button reports its pressed state', () => {
    render(h(Theme, {}));
    const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;
    expect(themeToggle.getAttribute('aria-pressed')).toBe('false');

    act(() => {
      themeToggle.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    expect(themeToggle.getAttribute('aria-pressed')).toBe('true');
  });

  test('theme toggle button click toggles the theme', () => {
    localStorage.setItem('theme', 'light');
    render(h(Theme, {}));
    const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;

    act(() => {
      themeToggle.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    expect(isDark()).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');

    act(() => {
      themeToggle.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
    expect(isDark()).toBe(false);
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
