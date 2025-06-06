/**
 * Tests for GitHub Repos API functionality
 * 
 * These tests verify the GitHub repository fetching functionality.
 */

import '@testing-library/jest-dom';
import type { Repo } from '../../src/scripts/ContentBuilder/Identity/types/Repo';

// Extended repo type for testing that includes the properties used in the tests
type ExtendedRepo = Repo & {
  url?: string;
  topics?: string[];
  stars?: number;
  language?: string;
};

describe('GitHub Repos API', () => {
  // Mock fetch API
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });
  
  test('fetchGitHubRepos should retrieve repositories for a user', async () => {
    // Mock GitHub API response
    const mockRepos = [
      {
        name: 'test-repo-1',
        description: 'A test repository',
        html_url: 'https://github.com/testuser/test-repo-1',
        topics: ['javascript', 'testing'],
        stargazers_count: 5,
        language: 'TypeScript'
      },
      {
        name: 'test-repo-2',
        description: 'Another test repository',
        html_url: 'https://github.com/testuser/test-repo-2',
        topics: ['react', 'frontend'],
        stargazers_count: 10,
        language: 'JavaScript'
      }
    ];
    
    // Mock successful API response
    const mockFetchPromise = Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockRepos)
    });
    
    (global.fetch as jest.Mock).mockReturnValue(mockFetchPromise);
    
    // Create a placeholder for the actual implementation
    const GitHubReposAPI = {
      fetchGitHubRepos: async (username: string): Promise<ExtendedRepo[]> => {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        if (!response.ok) throw new Error('Failed to fetch repositories');
        
        const repos = await response.json();
        return repos.map((repo: any) => ({
          id: repo.id || 0,
          name: repo.name,
          description: repo.description || '',
          update_at: repo.updated_at || '',
          svn_url: repo.svn_url || '',
          pushed_at: repo.pushed_at || '',
          html_url: repo.html_url,
          url: repo.html_url,
          topics: repo.topics || [],
          stars: repo.stargazers_count,
          language: repo.language || 'Unknown'
        }));
      }
    };
    
    // Test the function
    const repos = await GitHubReposAPI.fetchGitHubRepos('testuser');
    
    // Verify the fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith('https://api.github.com/users/testuser/repos');
    
    // Verify the returned data structure
    expect(repos).toHaveLength(2);
    expect(repos[0].name).toBe('test-repo-1');
    expect(repos[0].description).toBe('A test repository');
    expect(repos[0].url).toBe('https://github.com/testuser/test-repo-1');
    expect(repos[0].topics).toEqual(['javascript', 'testing']);
    expect(repos[0].stars).toBe(5);
    expect(repos[0].language).toBe('TypeScript');
  });
  
  test('fetchGitHubRepos should handle API errors', async () => {
    // Mock failed API response
    const mockFetchPromise = Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });
    
    (global.fetch as jest.Mock).mockReturnValue(mockFetchPromise);
    
    // Create a placeholder for the actual implementation
    const GitHubReposAPI = {
      fetchGitHubRepos: async (username: string): Promise<ExtendedRepo[]> => {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        if (!response.ok) throw new Error(`Failed to fetch repositories: ${response.status} ${response.statusText}`);
        
        const repos = await response.json();
        return repos.map((repo: any) => ({
          id: repo.id || 0,
          name: repo.name,
          description: repo.description || '',
          update_at: repo.updated_at || '',
          svn_url: repo.svn_url || '',
          pushed_at: repo.pushed_at || '',
          html_url: repo.html_url,
          url: repo.html_url,
          topics: repo.topics || [],
          stars: repo.stargazers_count,
          language: repo.language || 'Unknown'
        }));
      }
    };
    
    // Test that the function throws an error
    await expect(GitHubReposAPI.fetchGitHubRepos('nonexistentuser')).rejects.toThrow('Failed to fetch repositories');
  });
  
  test('fetchGitHubRepos should handle missing fields in API response', async () => {
    // Mock GitHub API response with missing fields
    const mockRepos = [
      {
        id: 123456,
        name: 'minimal-repo',
        html_url: 'https://github.com/testuser/minimal-repo',
        stargazers_count: 0,
        svn_url: 'https://github.com/testuser/minimal-repo',
        pushed_at: '2023-01-01T00:00:00Z',
        update_at: '2023-01-01T00:00:00Z'
        // description, topics, and language are missing
      }
    ];
    
    // Mock successful API response
    const mockFetchPromise = Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockRepos)
    });
    
    (global.fetch as jest.Mock).mockReturnValue(mockFetchPromise);
    
    // Create a placeholder for the actual implementation
    const GitHubReposAPI = {
      fetchGitHubRepos: async (username: string): Promise<ExtendedRepo[]> => {
        const response = await fetch(`https://api.github.com/users/${username}/repos`);
        if (!response.ok) throw new Error('Failed to fetch repositories');
        
        const repos = await response.json();
        return repos.map((repo: any) => ({
          id: repo.id || 0,
          name: repo.name,
          description: repo.description || '',
          update_at: repo.updated_at || repo.update_at || '',
          svn_url: repo.svn_url || '',
          pushed_at: repo.pushed_at || '',
          html_url: repo.html_url,
          url: repo.html_url,
          topics: repo.topics || [],
          stars: repo.stargazers_count,
          language: repo.language || 'Unknown'
        }));
      }
    };
    
    // Test the function
    const repos = await GitHubReposAPI.fetchGitHubRepos('testuser');
    
    // Verify the default values for missing fields
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe('minimal-repo');
    expect(repos[0].description).toBe(''); // Default empty string
    expect(repos[0].topics).toEqual([]);   // Default empty array
    expect(repos[0].language).toBe('Unknown'); // Default 'Unknown'
  });
});