import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  FEATURE_ID as ASCII_BACKGROUND_ID,
  INTENSITY_SETTING_ID,
  clampIntensity,
  prefersReducedMotion,
  readEnabled as readAsciiBackgroundEnabled,
  readIntensity as readAsciiBackgroundIntensity,
  writeEnabled as writeAsciiBackgroundEnabled,
  writeIntensity as writeAsciiBackgroundIntensity,
} from '../../scripts/ui/features/AsciiBackground/prefs';

/** A secondary control shown under a feature's switch, e.g. an intensity slider. */
interface FeatureControl {
  type: 'range';
  /** Id of the input and of the `feature-setting` event it dispatches. */
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface FeatureToggle {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  control?: FeatureControl;
}

/**
 * Check if we're in a browser environment (has window object)
 */
const isBrowser = () => typeof window !== 'undefined';

/**
 * Safe wrapper for localStorage to handle SSR
 */
const getLocalStorageItem = (key: string, defaultValue: string = ''): string => {
  if (!isBrowser()) return defaultValue;
  return localStorage.getItem(key) || defaultValue;
};

/**
 * Safe wrapper for localStorage to handle SSR
 */
const setLocalStorageItem = (key: string, value: string): void => {
  if (isBrowser()) {
    localStorage.setItem(key, value);
  }
};

/** Whether a feature is on, from localStorage (its default when nothing is stored). */
const storedEnabled = (id: string): boolean => {
  switch (id) {
    case 'chaos-mode':
      return getLocalStorageItem('chaosMode') === 'enabled';
    case 'obfuscator':
      return getLocalStorageItem('obfuscator') === 'enabled';
    case 'content-highlighter': {
      // On unless stored off; off by default for visitors who ask for reduced motion (it animates on scroll)
      const stored = getLocalStorageItem('contentHighlighter');
      if (stored === 'enabled') return true;
      if (stored === 'disabled') return false;
      return !prefersReducedMotion();
    }
    case 'dark-mode':
      return getLocalStorageItem('theme') === 'dark';
    case ASCII_BACKGROUND_ID:
      return readAsciiBackgroundEnabled();
    default:
      return false;
  }
};

const FEATURES: FeatureToggle[] = [
  {
    id: 'chaos-mode',
    name: 'Chaos Mode',
    enabled: false,
    description: 'Adds random chaotic effects to the page'
  },
  {
    id: 'obfuscator',
    name: 'Text Obfuscator',
    enabled: false,
    description: 'Obfuscates text on the page with various effects'
  },
  {
    id: 'content-highlighter',
    name: 'Content Highlighter',
    enabled: true,
    description: 'Highlights content in viewport and darkens content outside'
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    enabled: false,
    description: 'Toggles between dark and light theme'
  },
  {
    id: ASCII_BACKGROUND_ID,
    name: 'ASCII Background',
    enabled: true,
    description: 'Plays a seasonal ascii art piece behind the page',
    control: {
      type: 'range',
      id: INTENSITY_SETTING_ID,
      label: 'Intensity',
      min: 0,
      max: 100,
      step: 5,
    },
  },
];

/**
 * Settings component for toggling various UI features
 * This component provides a settings panel to enable/disable various features
 * like ChaosMode, Obfuscator, ContentHighlighter, etc.
 */
const Settings = () => {
  // Initialize state
  const [isOpen, setIsOpen] = useState(false);
  const toggleButton = useRef<HTMLButtonElement>(null);
  // Read the stored choices on the first render (the component only renders
  // in the browser), so the first persistence effect below never writes the
  // defaults over them and never announces a state the visitor did not pick.
  const [features, setFeatures] = useState<FeatureToggle[]>(() =>
    isBrowser() ? FEATURES.map(feature => ({ ...feature, enabled: storedEnabled(feature.id) })) : FEATURES
  );
  const [intensity, setIntensity] = useState<number>(() =>
    isBrowser() ? readAsciiBackgroundIntensity() : clampIntensity(undefined)
  );

  // Update localStorage when features change
  useEffect(() => {
    if (!isBrowser()) return;
    
    features.forEach(feature => {
      switch (feature.id) {
        case 'chaos-mode':
          setLocalStorageItem('chaosMode', feature.enabled ? 'enabled' : 'disabled');
          break;
        case 'obfuscator':
          setLocalStorageItem('obfuscator', feature.enabled ? 'enabled' : 'disabled');
          break;
        case 'content-highlighter':
          setLocalStorageItem('contentHighlighter', feature.enabled ? 'enabled' : 'disabled');
          break;
        case 'dark-mode':
          // Only update localStorage, Theme.tsx handles the actual toggle
          setLocalStorageItem('theme', feature.enabled ? 'dark' : 'light');
          
          // Also update the HTML class to maintain sync with Theme component
          if (isBrowser() && document.documentElement) {
            document.documentElement.classList.toggle('dark', feature.enabled);
          }
          break;
        case ASCII_BACKGROUND_ID:
          writeAsciiBackgroundEnabled(feature.enabled);
          break;
      }

      // Dispatch a custom event so other components can react to setting changes
      if (isBrowser() && document.dispatchEvent) {
        document.dispatchEvent(new CustomEvent('feature-toggle', {
          detail: { id: feature.id, enabled: feature.enabled }
        }));
      }
    });
  }, [features]);

  // Persist and announce the intensity slider
  useEffect(() => {
    if (!isBrowser()) return;
    writeAsciiBackgroundIntensity(intensity);
    document.dispatchEvent(new CustomEvent('feature-setting', {
      detail: { id: INTENSITY_SETTING_ID, value: intensity }
    }));
  }, [intensity]);

  // Toggle a feature by ID
  const toggleFeature = (id: string) => {
    setFeatures(prevFeatures => 
      prevFeatures.map(feature => 
        feature.id === id ? { ...feature, enabled: !feature.enabled } : feature
      )
    );
  };

  // Toggle the settings panel
  const toggleSettings = () => {
    setIsOpen(!isOpen);
  };

  // Escape closes the panel and puts focus back on the button that opened it
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !isOpen) return;
    setIsOpen(false);
    toggleButton.current?.focus();
  };

  // Don't render anything on the server
  if (!isBrowser()) {
    return null;
  }

  return (
    <aside class="settings-component" aria-label="Site settings" onKeyDown={handleKeyDown}>
      {/* Settings toggle button: a disclosure that announces whether the panel is open */}
      <button 
        id="settingsToggle"
        class="settings-toggle"
        type="button"
        onClick={toggleSettings}
        aria-label="Settings"
        aria-expanded={isOpen}
        aria-controls="settings-panel"
        ref={toggleButton}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>

      {/* Settings panel: inert while closed, so its controls are neither focusable nor announced */}
      <div
        id="settings-panel"
        class={`settings-panel ${isOpen ? 'open' : ''}`}
        aria-labelledby="settings-heading"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div class="settings-header">
          <h2 id="settings-heading">Settings</h2>
          <button 
            class="close-settings"
            type="button"
            onClick={toggleSettings}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>
        
        <div class="settings-content">
          <ul class="feature-list">
            {features.map(feature => (
              <li key={feature.id} class="feature-item">
                <div class="feature-header">
                  <label class="feature-label" htmlFor={feature.id}>
                    {feature.name}
                  </label>
                  <label class="toggle-switch" htmlFor={feature.id}>
                    <input
                      type="checkbox"
                      id={feature.id}
                      checked={feature.enabled}
                      onChange={() => toggleFeature(feature.id)}
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <p class="feature-description">{feature.description}</p>
                {feature.control && (
                  <label class="feature-range" htmlFor={feature.control.id}>
                    <span>{feature.control.label}: {intensity}%</span>
                    <input
                      type="range"
                      id={feature.control.id}
                      min={feature.control.min}
                      max={feature.control.max}
                      step={feature.control.step}
                      value={intensity}
                      disabled={!feature.enabled}
                      onInput={(event) => setIntensity(clampIntensity((event.currentTarget as HTMLInputElement).value))}
                    />
                  </label>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Settings;
