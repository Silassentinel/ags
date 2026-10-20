import { h } from 'preact';
import { render } from '@testing-library/preact';
import '@testing-library/jest-dom';
import ChaosMode from '../src/components/features/ChaosMode/ChaosMode';
import { DEFAULT_CONFIG } from '../src/scripts/ui/features/ChaosMode/Types/types';

/**
 * The Preact ChaosMode component renders nothing; its job is to start the
 * ChaosMode script once it mounts. The script itself is covered by
 * test/ts/ChaosMode.test.ts and test/ts/Utilities.test.ts.
 */
describe('ChaosMode Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '<main><p id="text">hello</p></main>';
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('renders no markup of its own', () => {
    const { container } = render(h(ChaosMode, {}));
    expect(container).toBeEmptyDOMElement();
  });

  test('starts the chaos script on mount so clicks are counted', () => {
    render(h(ChaosMode, {}));
    const target = document.getElementById('text') as HTMLElement;

    for (let i = 0; i < DEFAULT_CONFIG.chaosThreshold; i++) {
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    expect(document.body.classList.contains('chaos-mode')).toBe(true);
    expect(localStorage.getItem('chaosClickCount')).toBe(String(DEFAULT_CONFIG.chaosThreshold));
  });
});
