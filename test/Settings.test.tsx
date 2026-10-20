import { h } from 'preact';
import { render, fireEvent } from '@testing-library/preact';
import '@testing-library/jest-dom';
import Settings from '../src/components/ui/Settings';

/** Renders the panel and opens it. */
const renderOpen = () => {
  const result = render(h(Settings, {}));
  fireEvent.click(result.container.querySelector('#settingsToggle') as HTMLButtonElement);
  return result;
};

describe('Settings Component', () => {
  let dispatchEvent: jest.SpyInstance;

  beforeEach(() => {
    dispatchEvent = jest.spyOn(document, 'dispatchEvent');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders settings button', () => {
    const { container } = render(h(Settings, {}));
    expect(container.querySelector('#settingsToggle')).toBeInTheDocument();
  });

  test('toggles settings panel when button is clicked', () => {
    const { container } = render(h(Settings, {}));
    const settingsButton = container.querySelector('#settingsToggle') as HTMLButtonElement;
    const settingsPanel = container.querySelector('.settings-panel');

    expect(settingsPanel).not.toHaveClass('open');
    fireEvent.click(settingsButton);
    expect(settingsPanel).toHaveClass('open');
    fireEvent.click(settingsButton);
    expect(settingsPanel).not.toHaveClass('open');
  });

  test('initializes feature toggles from localStorage', () => {
    localStorage.setItem('chaosMode', 'disabled');
    localStorage.setItem('obfuscator', 'enabled');
    localStorage.setItem('contentHighlighter', 'disabled');
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('asciiBackground', 'disabled');

    const { container } = renderOpen();
    const checked = (id: string) => (container.querySelector(`#${id}`) as HTMLInputElement).checked;

    expect(checked('chaos-mode')).toBe(false);
    expect(checked('obfuscator')).toBe(true);
    expect(checked('content-highlighter')).toBe(false);
    expect(checked('dark-mode')).toBe(true);
    expect(checked('ascii-background')).toBe(false);
  });

  test('never overwrites a stored choice with the default on mount', () => {
    localStorage.setItem('chaosMode', 'enabled');
    localStorage.setItem('asciiBackground', 'disabled');
    render(h(Settings, {}));

    expect(localStorage.getItem('chaosMode')).toBe('enabled');
    expect(localStorage.getItem('asciiBackground')).toBe('disabled');
    const announced = dispatchEvent.mock.calls
      .map(([event]) => event as CustomEvent)
      .filter((event) => event.type === 'feature-toggle' && event.detail.id === 'ascii-background')
      .map((event) => event.detail.enabled);
    expect(announced).toEqual([false]);
  });

  test('toggles feature and updates localStorage when checkbox clicked', () => {
    const { container } = renderOpen();
    fireEvent.click(container.querySelector('#chaos-mode') as HTMLInputElement);

    expect(localStorage.getItem('chaosMode')).toBe('enabled');
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'feature-toggle',
        detail: expect.objectContaining({ id: 'chaos-mode', enabled: true }),
      })
    );
  });

  test('the ASCII background is on by default and can be switched off', () => {
    const { container } = renderOpen();
    const toggle = container.querySelector('#ascii-background') as HTMLInputElement;
    expect(toggle.checked).toBe(true);

    fireEvent.click(toggle);

    expect(toggle.checked).toBe(false);
    expect(localStorage.getItem('asciiBackground')).toBe('disabled');
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'feature-toggle',
        detail: expect.objectContaining({ id: 'ascii-background', enabled: false }),
      })
    );
  });

  test('the intensity slider shows the stored value, persists changes and announces them', () => {
    localStorage.setItem('asciiBackgroundIntensity', '45');
    const { container } = renderOpen();
    const slider = container.querySelector('#ascii-background-intensity') as HTMLInputElement;

    expect(slider.value).toBe('45');
    expect(container.querySelector('.feature-range')).toHaveTextContent('Intensity: 45%');

    fireEvent.input(slider, { target: { value: '80' } });

    expect(localStorage.getItem('asciiBackgroundIntensity')).toBe('80');
    expect(container.querySelector('.feature-range')).toHaveTextContent('Intensity: 80%');
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'feature-setting',
        detail: expect.objectContaining({ id: 'ascii-background-intensity', value: 80 }),
      })
    );
  });

  test('the intensity slider is disabled while the backdrop is switched off', () => {
    localStorage.setItem('asciiBackground', 'disabled');
    const { container } = renderOpen();
    const slider = container.querySelector('#ascii-background-intensity') as HTMLInputElement;
    expect(slider.disabled).toBe(true);

    fireEvent.click(container.querySelector('#ascii-background') as HTMLInputElement);
    expect(slider.disabled).toBe(false);
  });

  test('closes settings panel with close button', () => {
    const { container } = renderOpen();
    const settingsPanel = container.querySelector('.settings-panel');
    expect(settingsPanel).toHaveClass('open');

    fireEvent.click(container.querySelector('.close-settings') as HTMLButtonElement);
    expect(settingsPanel).not.toHaveClass('open');
  });
});
