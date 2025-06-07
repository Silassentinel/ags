import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { Repo } from '../../../scripts/ContentBuilder/Identity/types/Repo';

interface RepoFetcherProps {
  username: string;
}

/**
 * RepoFetcher component - Client-side fetching of GitHub repositories
 */
export function RepoFetcher({ username }: RepoFetcherProps) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect will run on the client side when the component mounts
    const fetchRepos = async () => {
      try {
        // First try to fetch from the local static file
        let response = await fetch(`https://api.github.com/users/${username}/repos`)
        
        // If local file fetch fails, get from GitHub API
        if (!response.ok) {
          response = await fetch('/data/ghuserRepo.json');;
          
          if (!response.ok) {
            throw new Error(`Failed to fetch repos: ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        setRepos(data);
      } catch (err) {
        console.error("Error fetching repositories:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch repositories");
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [username]);

  if (loading) return <div>Loading repositories...</div>;
  if (error) return <div>Error loading repositories: {error}</div>;
  if (!repos.length) return <div>No repositories found.</div>;

  return (
    <div className="repo-list">
      <h2>My GitHub Repositories</h2>
      <ul>
        {repos.map((repo) => (
          <li key={repo.id}>
            <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
              {repo.name}
            </a>
            <p>{repo.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RepoFetcher;
