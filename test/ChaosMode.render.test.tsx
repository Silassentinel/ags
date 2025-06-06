// filepath: /home/silas/code/Git/Repos/Website/ags/test/ChaosMode.render.test.tsx
import { h } from 'preact';
import { render } from '@testing-library/preact';
import '@testing-library/jest-dom';
import ChaosMode from '../src/components/features/ChaosMode/ChaosMode';

describe('ChaosMode Component Rendering', () => {
  it('should render without crashing', () => {
    const { container } = render(h(ChaosMode, {}));
    expect(container).toBeInTheDocument();
  });
});