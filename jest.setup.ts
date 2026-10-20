/**
 * Jest environment setup. The tests run against the real jsdom DOM; this
 * file only adds the browser APIs jsdom lacks and stubs the ones that must
 * not touch the outside world. It no longer replaces document.documentElement,
 * document.body or the query methods with jest.fn() objects: that made every
 * rendered component invisible to the assertions and every classList spy
 * meaningless (the suite was red on main because of it).
 */
import '@testing-library/jest-dom';

// IntersectionObserver: jsdom has none. Instances record the observed
// elements and expose simulateIntersection() for tests.
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];
  private readonly elements = new Set<Element>();

  constructor(private readonly callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    if (options?.root !== undefined) this.root = options.root;
    if (options?.rootMargin !== undefined) this.rootMargin = options.rootMargin;
    if (options?.threshold !== undefined) {
      this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold];
    }
  }

  observe(element: Element): void {
    this.elements.add(element);
  }

  unobserve(element: Element): void {
    this.elements.delete(element);
  }

  disconnect(): void {
    this.elements.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Test helper: fire the callback as if these entries intersected. */
  simulateIntersection(entries: IntersectionObserverEntry[]): void {
    this.callback(entries, this);
  }
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// ResizeObserver: jsdom has none either.
class MockResizeObserver implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// matchMedia: jsdom has none. Nothing matches by default; a test can
// override it with jest.spyOn(window, 'matchMedia').
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// A deterministic viewport for layout-related assertions.
Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
Object.defineProperty(window, 'innerHeight', { value: 768, writable: true, configurable: true });
Object.defineProperty(window, 'scrollTo', { value: jest.fn(), writable: true, configurable: true });
Object.defineProperty(window, 'scrollBy', { value: jest.fn(), writable: true, configurable: true });

// No test may reach the network. A test that needs fetch mocks it itself.
if (typeof globalThis.fetch !== 'function') {
  // @ts-ignore
  globalThis.fetch = jest.fn();
}
beforeAll(() => {
  jest.spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.reject(new Error('fetch is not available in tests; mock it in the test'))
  );
});

// Every test starts from a clean DOM and storage.
beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.className = '';
  localStorage.clear();
});
