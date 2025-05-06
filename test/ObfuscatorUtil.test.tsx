import { h } from 'preact';
import { render } from '@testing-library/preact';
import '@testing-library/jest-dom';
import ObfuscatorUtil from '../src/components/features/ChaosMode/ObfuscatorUtil';

describe('ObfuscatorUtil Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<ObfuscatorUtil />);
    expect(container).toBeInTheDocument();
  });
});