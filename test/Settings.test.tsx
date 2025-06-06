import { h } from 'preact';
import { render, fireEvent } from '@testing-library/preact';
import '@testing-library/jest-dom';
import Settings from '../src/components/ui/Settings';

describe('Settings Component', () => {
  beforeEach(() => {
    // Properly mock document.documentElement instead of trying to replace it
    const mockDocElement = document.createElement('html');
    Object.defineProperty(document, 'documentElement', {
      value: mockDocElement,
      writable: false,
      configurable: true
    });
    
    // Properly mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => {
          const mockData = {
            'chaosMode': 'disabled',
            'obfuscator': 'disabled',
            'contentHighlighter': 'enabled',
            'theme': 'light'
          };
          return mockData[key] || null;
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
      configurable: true
    });
    
    // Mock document.dispatchEvent
    document.dispatchEvent = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders settings button', () => {
    const { container } = render(h(Settings, {}));
    
    // Check that settings button exists
    const settingsButton = container.querySelector('#settingsToggle');
    expect(settingsButton).toBeInTheDocument();
  });
  
  test('toggles settings panel when button is clicked', () => {
    const { container } = render(h(Settings, {}));
    
    // Get settings button and panel
    const settingsButton = container.querySelector('#settingsToggle');
    const settingsPanel = container.querySelector('.settings-panel');
    
    // Initially panel should not have 'open' class
    expect(settingsPanel).not.toHaveClass('open');
    
    // Click the button to open panel
    if (settingsButton) {
      fireEvent.click(settingsButton);
    }
    
    // Panel should now have 'open' class
    expect(settingsPanel).toHaveClass('open');
    
    // Click again to close
    if (settingsButton) {
      fireEvent.click(settingsButton);
    }
    
    // Panel should no longer have 'open' class
    expect(settingsPanel).not.toHaveClass('open');
  });
  
  test('initializes feature toggles from localStorage', () => {
    const { container } = render(h(Settings, {}));
    
    // Open settings panel
    const settingsButton = container.querySelector('#settingsToggle');
    if (settingsButton) {
      fireEvent.click(settingsButton);
    }
    
    // Check checkbox states match localStorage values
    const chaosToggle = container.querySelector('#chaos-mode') as HTMLInputElement;
    const obfuscatorToggle = container.querySelector('#obfuscator') as HTMLInputElement;
    const highlighterToggle = container.querySelector('#content-highlighter') as HTMLInputElement;
    const darkModeToggle = container.querySelector('#dark-mode') as HTMLInputElement;
    
    expect(chaosToggle?.checked).toBeFalsy(); // disabled in mock
    expect(obfuscatorToggle?.checked).toBeFalsy(); // disabled in mock
    expect(highlighterToggle?.checked).toBeTruthy(); // enabled in mock
    expect(darkModeToggle?.checked).toBeFalsy(); // light in mock
  });
  
  test('toggles feature and updates localStorage when checkbox clicked', () => {
    const { container } = render(h(Settings, {}));
    
    // Open settings panel
    const settingsButton = container.querySelector('#settingsToggle');
    if (settingsButton) {
      fireEvent.click(settingsButton);
    }
    
    // Get chaos mode toggle
    const chaosToggle = container.querySelector('#chaos-mode') as HTMLInputElement;
    
    // Toggle chaos mode on
    if (chaosToggle) {
      fireEvent.click(chaosToggle);
    }
    
    // Check that localStorage was updated
    expect(window.localStorage.setItem).toHaveBeenCalledWith('chaosMode', 'enabled');
    
    // Check that a custom event was dispatched
    expect(document.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'feature-toggle',
        detail: expect.objectContaining({
          id: 'chaos-mode',
          enabled: true
        })
      })
    );
  });
  
  test('closes settings panel with close button', () => {
    const { container } = render(h(Settings, {}));
    
    // Open settings panel
    const settingsButton = container.querySelector('#settingsToggle');
    if (settingsButton) {
      fireEvent.click(settingsButton);
    }
    
    // Panel should be open
    const settingsPanel = container.querySelector('.settings-panel');
    expect(settingsPanel).toHaveClass('open');
    
    // Click close button
    const closeButton = container.querySelector('.close-settings');
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    
    // Panel should be closed
    expect(settingsPanel).not.toHaveClass('open');
  });
});