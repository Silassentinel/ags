// filepath: /home/silas/code/Git/Repos/Website/ags/test/RecipeFetcher.render.test.tsx
import { h } from 'preact';
import { render } from '@testing-library/preact';
import '@testing-library/jest-dom';
import RecipeFetcher from '../src/components/ContentBuilder/RecipeFetcher/RecipeFetcher';

describe('RecipeFetcher Component Rendering', () => {
  it('should render without crashing', () => {
    const { container } = render(<RecipeFetcher />);
    expect(container).toBeInTheDocument();
  });
});