/**
 * Tests for src/scripts/ui/features/ChaosMode/Obfuscator.ts against the real
 * jsdom document.
 */

import {
  Obfuscator,
  obfuscate,
  obfuscateElements,
  restoreElements,
  cyclicObfuscation,
  getRandomMethod,
  initObfuscatorWithChaosMode,
  type ObfuscationMethod,
} from '../../src/scripts/ui/features/ChaosMode/Obfuscator';

const METHODS: ObfuscationMethod[] = ['reverse', 'leetspeak', 'scramble', 'randomCapitalize', 'zalgo'];

/** Places an element at a vertical position; jsdom does no layout of its own. */
const placeAtTop = (element: Element, top: number): void => {
  jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    top, bottom: top + 20, left: 0, right: 100, width: 100, height: 20, x: 0, y: top, toJSON: () => ({}),
  } as DOMRect);
};

describe('Obfuscator TypeScript Implementation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test('obfuscate reverses text with the reverse method', () => {
    expect(obfuscate('hello world', { method: 'reverse' })).toBe('dlrow olleh');
  });

  test('obfuscate keeps the letters with the scramble method', () => {
    const result = obfuscate('hello world', { method: 'scramble' });
    expect(result.split('').sort()).toEqual('hello world'.split('').sort());
  });

  test('obfuscate only changes case with the randomCapitalize method', () => {
    expect(obfuscate('Hello World', { method: 'randomCapitalize' }).toLowerCase()).toBe('hello world');
  });

  test('obfuscate adds combining marks with the zalgo method', () => {
    const result = obfuscate('hello', { method: 'zalgo', intensity: 3 });
    expect(result.replace(/[̀-ͯ]/g, '')).toBe('hello');
  });

  test('obfuscate picks a random method when none is given', () => {
    const spy = jest.spyOn(Obfuscator, 'getRandomMethod').mockReturnValue('reverse');
    expect(obfuscate('abc')).toBe('cba');
    expect(spy).toHaveBeenCalled();
  });

  test('obfuscate returns empty text unchanged', () => {
    expect(obfuscate('')).toBe('');
  });

  test('getRandomMethod returns a valid obfuscation method', () => {
    for (let i = 0; i < 20; i++) {
      expect(METHODS).toContain(getRandomMethod());
    }
  });

  test('obfuscateElements rewrites matching elements and keeps the original text', () => {
    document.body.innerHTML = '<p>hello</p><h1>title</h1>';
    obfuscateElements('p, h1', { method: 'reverse', onlyVisible: false });

    const [p, h1] = [document.querySelector('p')!, document.querySelector('h1')!];
    expect(p.textContent).toBe('olleh');
    expect(h1.textContent).toBe('eltit');
    expect(p.dataset.originalText).toBe('hello');
    expect(h1.dataset.originalText).toBe('title');
  });

  test('obfuscateElements respects the onlyVisible option', () => {
    document.body.innerHTML = '<p>visible</p><h1>hidden</h1>';
    placeAtTop(document.querySelector('p')!, 10);
    placeAtTop(document.querySelector('h1')!, window.innerHeight + 500);

    obfuscateElements('p, h1', { method: 'reverse', onlyVisible: true });

    expect(document.querySelector('p')!.textContent).toBe('elbisiv');
    expect(document.querySelector('h1')!.textContent).toBe('hidden');
  });

  test('obfuscateElements is a no-op for a selector that matches nothing', () => {
    document.body.innerHTML = '<p>hello</p>';
    expect(() => obfuscateElements('.nothing', { method: 'reverse' })).not.toThrow();
    expect(document.querySelector('p')!.textContent).toBe('hello');
  });

  test('restoreElements restores the original text', () => {
    document.body.innerHTML = '<p>hello</p><h1>title</h1>';
    obfuscateElements('p, h1', { method: 'reverse', onlyVisible: false });
    restoreElements('p, h1');

    expect(document.querySelector('p')!.textContent).toBe('hello');
    expect(document.querySelector('h1')!.textContent).toBe('title');
  });

  test('cyclicObfuscation re-obfuscates on every interval until stopped', () => {
    jest.useFakeTimers();
    document.body.innerHTML = '<p>hello</p>';
    const obfuscateSpy = jest.spyOn(Obfuscator, 'obfuscateElements');
    const restoreSpy = jest.spyOn(Obfuscator, 'restoreElements');

    const stop = cyclicObfuscation('p', { interval: 1000, onlyVisible: false });
    expect(obfuscateSpy).toHaveBeenCalledTimes(1); // runs once immediately

    jest.advanceTimersByTime(1000);
    expect(obfuscateSpy).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(2000);
    expect(obfuscateSpy).toHaveBeenCalledTimes(4);

    stop();
    expect(restoreSpy).toHaveBeenCalledTimes(1);
    expect(document.querySelector('p')!.textContent).toBe('hello');

    jest.advanceTimersByTime(10000);
    expect(obfuscateSpy).toHaveBeenCalledTimes(4); // nothing runs after stop()
  });

  test('cyclicObfuscation restores the text by itself once the duration has passed', () => {
    jest.useFakeTimers();
    document.body.innerHTML = '<p>hello</p>';
    const restoreSpy = jest.spyOn(Obfuscator, 'restoreElements');

    cyclicObfuscation('p', { interval: 1000, duration: 2500, onlyVisible: false });
    jest.advanceTimersByTime(3000);

    expect(restoreSpy).toHaveBeenCalled();
    expect(document.querySelector('p')!.textContent).toBe('hello');
  });

  test('initObfuscatorWithChaosMode waits for DOMContentLoaded', () => {
    const addEventListener = jest.spyOn(document, 'addEventListener');
    initObfuscatorWithChaosMode();
    expect(addEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
  });
});
