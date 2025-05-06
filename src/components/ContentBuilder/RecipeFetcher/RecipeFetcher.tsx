import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

interface Recipe {
  name: string;
  content: string;
  url: string;
}

interface RecipeFetcherProps {
  // Options for customizing fetching behavior
  repoOwner?: string;
  repoName?: string;
  branch?: string;
  onFetchComplete?: (recipes: Recipe[]) => void;
}

/**
 * RecipeFetcher component - Fetches recipes from GitHub and processes them
 * 
 * This component doesn't render anything visible but handles the data fetching
 * and processing of recipes from a GitHub repository.
 */
export function RecipeFetcher({
  repoOwner = 'Silassentinel',
  repoName = 'Recipes',
  branch = 'main',
  onFetchComplete
}: RecipeFetcherProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect will run on the client side when the component mounts
    if (typeof window === 'undefined') return;

    const fetchRecipes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, fetch the repository contents to get all files
        const repoUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents?ref=${branch}`;
        const response = await fetch(repoUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch repository contents: ${response.statusText}`);
        }
        
        const contents = await response.json();
        
        // Filter for markdown files (recipes)
        const markdownFiles = contents.filter((file: any) => 
          file.type === 'file' && file.name.endsWith('.md') && file.name !== '1ATEMPLATE.MD'
        );
        
        // Fetch the raw content of each recipe file
        const recipePromises = markdownFiles.map(async (file: any) => {
          const rawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${file.name}`;
          const rawResponse = await fetch(rawUrl);
          
          if (!rawResponse.ok) {
            throw new Error(`Failed to fetch recipe content for ${file.name}: ${rawResponse.statusText}`);
          }
          
          const content = await rawResponse.text();
          
          // Return a recipe object
          return {
            name: file.name.replace('.md', ''),
            content,
            url: rawUrl
          };
        });
        
        // Wait for all recipes to be fetched
        const fetchedRecipes = await Promise.all(recipePromises);
        setRecipes(fetchedRecipes);
        
        // Call the callback if provided
        if (onFetchComplete) {
          onFetchComplete(fetchedRecipes);
        }
        
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch recipes');
      } finally {
        setLoading(false);
      }
    };

    // Run the fetch operation
    fetchRecipes();
  }, [repoOwner, repoName, branch, onFetchComplete]);

  // This component doesn't render anything, it just performs the data fetching
  return null;
}

export default RecipeFetcher;