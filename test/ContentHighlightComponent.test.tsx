import { h } from 'preact';
import { render } from '@testing-library/preact';
import '@testing-library/jest-dom';
import ContentHighlight, { isContentHighlightEnabled } from '../src/components/features/ContentHighlight/ContentHighlight';

/** The IntersectionObserver instances created by the component (from jest.setup.ts's mock). */
const observers = (): any[] => (IntersectionObserver as any).instances ?? [];

describe('ContentHighlight component', () => {
  let observeCalls: Element[];

  beforeEach(() => {
    observeCalls = [];
    jest.spyOn(IntersectionObserver.prototype, 'observe').mockImplementation(function (this: any, el: Element) {
      observeCalls.push(el);
    });
    document.body.innerHTML = '<section class="highlight-in-viewport">a</section><section class="highlight-in-viewport">b</section>';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('is on by default and observes every highlight element', () => {
    render(h(ContentHighlight, {}));
    expect(observeCalls).toHaveLength(2);
  });

  test('stays off when the Settings panel stored "disabled"', () => {
    localStorage.setItem('contentHighlighter', 'disabled');
    render(h(ContentHighlight, {}));
    expect(observeCalls).toHaveLength(0);
  });

  test('is off by default for visitors who ask for reduced motion, unless they opted in', () => {
    (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
    expect(isContentHighlightEnabled()).toBe(false);
    localStorage.setItem('contentHighlighter', 'enabled');
    expect(isContentHighlightEnabled()).toBe(true);
  });

  test('switching it off from Settings stops observing and clears the classes', () => {
    render(h(ContentHighlight, {}));
    const [first] = Array.from(document.querySelectorAll('.highlight-in-viewport'));
    first.classList.add('content-highlighted');
    const disconnect = jest.spyOn(IntersectionObserver.prototype, 'disconnect');

    document.dispatchEvent(new CustomEvent('feature-toggle', { detail: { id: 'content-highlighter', enabled: false } }));

    expect(disconnect).toHaveBeenCalled();
    expect(first.classList.contains('content-highlighted')).toBe(false);

    document.dispatchEvent(new CustomEvent('feature-toggle', { detail: { id: 'content-highlighter', enabled: true } }));
    expect(observeCalls).toHaveLength(4); // observed again after re-enabling
  });
});
