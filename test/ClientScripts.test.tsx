import { h } from 'preact';
import { render } from '@testing-library/preact';
import '@testing-library/jest-dom';
import ClientScripts from '../src/components/ui/ClientScripts';

// Mock the imported components
jest.mock('../src/components/features/ChaosMode/ChaosMode', () => () => h('div', {'data-testid': 'chaos-mode-component'}));
jest.mock('../src/components/ui/Menu', () => () => h('div', {'data-testid': 'menu-component'}));
jest.mock('../src/components/ui/Theme', () => () => h('div', {'data-testid': 'theme-component'}));
jest.mock('../src/components/features/ContentHighlight/ContentHighlight', () => () => 
  h('div', {'data-testid': 'content-highlight-component'}));

describe('ClientScripts Component', () => {
  test('renders all client-side script components', () => {
    const { getByTestId } = render(h(ClientScripts, null));
    
    // Check that all components are rendered
    expect(getByTestId('theme-component')).toBeInTheDocument();
    expect(getByTestId('menu-component')).toBeInTheDocument();
    expect(getByTestId('content-highlight-component')).toBeInTheDocument();
    expect(getByTestId('chaos-mode-component')).toBeInTheDocument();
  });
});