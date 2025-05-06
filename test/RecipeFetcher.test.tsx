import { h } from 'preact';
import { render, waitFor } from '@testing-library/preact';
import { renderHook } from '@testing-library/preact-hooks';
import '@testing-library/jest-dom';
import RecipeFetcher from '../src/components/ContentBuilder/RecipeFetcher/RecipeFetcher';

// Mock fetch API
global.fetch = jest.fn();

describe('RecipeFetcher Component', () => {
  beforeEach(() => {
    // Reset the fetch mock before each test
    jest.resetAllMocks();
  });
  
  test('fetches recipes successfully', async () => {
    // Mock successful API responses
    const mockRepoContents = [
      { name: 'Recipe1.md', type: 'file' },
      { name: 'Recipe2.md', type: 'file' },
      { name: '1ATEMPLATE.MD', type: 'file' } // This one should be filtered out
    ];
    
    const mockRecipe1Content = '# Recipe 1\nIngredients: Ingredient 1';
    const mockRecipe2Content = '# Recipe 2\nIngredients: Ingredient 2';
    
    // Setup fetch mock implementation
    global.fetch.mockImplementation((url) => {
      if (url.includes('/contents')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRepoContents)
        });
      } else if (url.includes('Recipe1.md')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockRecipe1Content)
        });
      } else if (url.includes('Recipe2.md')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockRecipe2Content)
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
    
    // Mock callback function
    const onFetchComplete = jest.fn();
    
    // Render the component
    render(h(RecipeFetcher, { onFetchComplete }));
    
    // Wait for the fetch operations to complete
    await waitFor(() => {
      expect(onFetchComplete).toHaveBeenCalled();
    });
    
    // Verify that the correct API calls were made
    expect(global.fetch).toHaveBeenCalledTimes(3); // One for repo contents + two for recipes
    
    // Check that the callback was called with the expected data
    expect(onFetchComplete).toHaveBeenCalledWith([
      {
        name: 'Recipe1',
        content: mockRecipe1Content,
        url: expect.stringContaining('Recipe1.md')
      },
      {
        name: 'Recipe2',
        content: mockRecipe2Content,
        url: expect.stringContaining('Recipe2.md')
      }
    ]);
  });
  
  test('handles API errors gracefully', async () => {
    // Mock failed API response
    global.fetch.mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        statusText: 'Not Found'
      });
    });
    
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock callback function
    const onFetchComplete = jest.fn();
    
    // Render the component
    render(h(RecipeFetcher, { onFetchComplete }));
    
    // Wait for the fetch operation to complete
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    // Verify that the callback was not called
    expect(onFetchComplete).not.toHaveBeenCalled();
    
    // Clean up
    consoleErrorSpy.mockRestore();
  });
  
  test('respects custom repository parameters', async () => {
    // Mock successful API response
    global.fetch.mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
        text: () => Promise.resolve('')
      });
    });
    
    // Custom props
    const customProps = {
      repoOwner: 'TestOwner',
      repoName: 'TestRepo',
      branch: 'test-branch'
    };
    
    // Render the component with custom props
    render(h(RecipeFetcher, customProps));
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`${customProps.repoOwner}/${customProps.repoName}/contents?ref=${customProps.branch}`)
      );
    });
  });
  
  test('filters out template files', async () => {
    // Mock repository contents with a template file
    const mockRepoContents = [
      { name: 'Recipe.md', type: 'file' },
      { name: '1ATEMPLATE.MD', type: 'file' }, // Should be filtered out
      { name: 'README.md', type: 'file' } // Not a recipe
    ];
    
    // Setup fetch mock
    global.fetch.mockImplementation((url) => {
      if (url.includes('/contents')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRepoContents)
        });
      } else if (url.includes('Recipe.md')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('Recipe content')
        });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });
    
    // Mock callback
    const onFetchComplete = jest.fn();
    
    // Render the component
    render(h(RecipeFetcher, { onFetchComplete }));
    
    // Wait for the callback
    await waitFor(() => {
      expect(onFetchComplete).toHaveBeenCalled();
    });
    
    // Check that only one recipe was fetched (template was filtered out)
    expect(onFetchComplete).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Recipe' })
    ]);
  });
});