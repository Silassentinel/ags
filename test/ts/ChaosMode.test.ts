/**
 * Tests for src/scripts/ui/features/ChaosMode/ChaosMode.ts against the real
 * jsdom document: the click thresholds, the Settings switch and the
 * "disabled by the user" guard.
 */

import { ChaosMode, initChaosMode } from '../../src/scripts/ui/features/ChaosMode/ChaosMode';
import { DEFAULT_CONFIG } from '../../src/scripts/ui/features/ChaosMode/Types/types';

const clickPage = (times: number): void => {
  const target = document.getElementById('text') as HTMLElement;
  for (let i = 0; i < times; i++) {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
};

const bodyHas = (className: string): boolean => document.body.classList.contains(className);

describe('ChaosMode TypeScript Implementation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '<main><h1>Title</h1><p id="text">hello world</p><a href="/">link</a></main>';
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('ChaosMode class can be instantiated without touching the page', () => {
    const instance = new ChaosMode();
    expect(instance).toBeInstanceOf(ChaosMode);
    expect(bodyHas('chaos-mode')).toBe(false);
  });

  test('initialize registers the pointer, click and Settings listeners on the document', () => {
    const addEventListener = jest.spyOn(document, 'addEventListener');
    new ChaosMode().initialize();

    const registered = addEventListener.mock.calls.map(([type]) => type);
    expect(registered).toEqual(
      expect.arrayContaining(['click', 'mousemove', 'touchstart', 'touchmove', 'feature-toggle'])
    );
  });

  test('chaos mode is activated after the configured number of clicks', () => {
    new ChaosMode().initialize();

    clickPage(DEFAULT_CONFIG.chaosThreshold - 1);
    expect(bodyHas('chaos-mode')).toBe(false);

    clickPage(1);
    expect(bodyHas('chaos-mode')).toBe(true);
    expect(localStorage.getItem('chaosClickCount')).toBe(String(DEFAULT_CONFIG.chaosThreshold));
  });

  test('ultra chaos mode is activated after even more clicks', () => {
    new ChaosMode().initialize();

    clickPage(DEFAULT_CONFIG.ultraChaosThreshold);
    expect(bodyHas('chaos-mode')).toBe(true);
    expect(bodyHas('ultra-chaos-mode')).toBe(true);
    expect(localStorage.getItem('chaosClickCount')).toBe(String(DEFAULT_CONFIG.ultraChaosThreshold));
  });

  test('a stored click count above the threshold restores chaos mode on initialize', () => {
    localStorage.setItem('chaosClickCount', String(DEFAULT_CONFIG.chaosThreshold));
    new ChaosMode().initialize();
    expect(bodyHas('chaos-mode')).toBe(true);
  });

  test('stays dormant when the user disabled chaos mode in Settings', () => {
    localStorage.setItem('chaosMode', 'disabled');
    new ChaosMode().initialize();

    clickPage(DEFAULT_CONFIG.ultraChaosThreshold);
    expect(bodyHas('chaos-mode')).toBe(false);
    expect(localStorage.getItem('chaosClickCount')).toBe('0');
  });

  test('switching chaos mode off from Settings cleans up and resets the count', () => {
    new ChaosMode().initialize();
    clickPage(DEFAULT_CONFIG.chaosThreshold);
    expect(bodyHas('chaos-mode')).toBe(true);

    document.dispatchEvent(
      new CustomEvent('feature-toggle', { detail: { id: 'chaos-mode', enabled: false } })
    );

    expect(bodyHas('chaos-mode')).toBe(false);
    expect(bodyHas('ultra-chaos-mode')).toBe(false);
    expect(localStorage.getItem('chaosClickCount')).toBe('0');
  });

  test('other feature toggles are ignored', () => {
    new ChaosMode().initialize();
    clickPage(DEFAULT_CONFIG.chaosThreshold);

    document.dispatchEvent(
      new CustomEvent('feature-toggle', { detail: { id: 'content-highlighter', enabled: false } })
    );

    expect(bodyHas('chaos-mode')).toBe(true);
  });

  test('initChaosMode creates and initialises the shared instance', () => {
    const addEventListener = jest.spyOn(document, 'addEventListener');
    initChaosMode();
    expect(addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
});
