import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

interface FeatureToggle {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
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

/**
 * Settings component for toggling various UI features
 * This component provides a settings panel to enable/disable various features
 * like ChaosMode, Obfuscator, ContentHighlighter, etc.
 */
const Settings = () => {
  // Initialize state
  const [isOpen, setIsOpen] = useState(false);
  const [features, setFeatures] = useState<FeatureToggle[]>([
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
    }
  ]);
  
  // Initialize state from localStorage if available after component mounts
  useEffect(() => {
    if (!isBrowser()) return;
    
    setFeatures(prev => prev.map(feature => {
      let enabled = false;
      
      switch (feature.id) {
        case 'chaos-mode':
          enabled = getLocalStorageItem('chaosMode') === 'enabled';
          break;
        case 'obfuscator':
          enabled = getLocalStorageItem('obfuscator') === 'enabled';
          break;
        case 'content-highlighter':
          enabled = getLocalStorageItem('contentHighlighter') !== 'disabled';
          break;
        case 'dark-mode':
          enabled = getLocalStorageItem('theme') === 'dark';
          break;
      }
      
      return { ...feature, enabled };
    }));
  }, []);

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
      }

      // Dispatch a custom event so other components can react to setting changes
      if (isBrowser() && document.dispatchEvent) {
        document.dispatchEvent(new CustomEvent('feature-toggle', {
          detail: { id: feature.id, enabled: feature.enabled }
        }));
      }
    });
  }, [features]);

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

  // Don't render anything on the server
  if (!isBrowser()) {
    return null;
  }

  return (
    <div class="settings-component">
      {/* Settings toggle button */}
      <button 
        id="settingsToggle"
        class="settings-toggle"
        onClick={toggleSettings}
        aria-label="Toggle Settings Panel"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>

      {/* Settings panel */}
      <div class={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div class="settings-header">
          <h3>Settings</h3>
          <button 
            class="close-settings"
            onClick={toggleSettings}
            aria-label="Close Settings Panel"
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
                  <div class="toggle-switch">
                    <input
                      type="checkbox"
                      id={feature.id}
                      checked={feature.enabled}
                      onChange={() => toggleFeature(feature.id)}
                    />
                    <span class="toggle-slider"></span>
                  </div>
                </div>
                <p class="feature-description">{feature.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;