// filepath: /home/silas/code/Git/Repos/Website/ags/test/RecipeFetcher.render.test.tsx
import { h } from 'preact';
import { render } from '@testing-library/preact';
import '@testing-library/jest-dom';
import RecipeFetcher from '../src/components/ContentBuilder/RecipeFetcher/RecipeFetcher';

describe('RecipeFetcher Component Rendering', () => {
  it('should render without crashing', () => {
    // Mock onFetchComplete callback
    const onFetchComplete = jest.fn();
    
    // RecipeFetcher expects these props
    const props = {
      repoOwner: 'TestOwner',
      repoName: 'TestRepo',
      branch: 'main',
      onFetchComplete
    };
    
    // The component doesn't render anything visible, so we're just testing that it doesn't crash
    const { container } = render(h(RecipeFetcher, props));
    expect(container).toBeInTheDocument();
  });
});