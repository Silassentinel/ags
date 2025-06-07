import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

// Define types for blog posts
interface Frontmatter {
  title: string;
  pubDate?: string;
  description?: string;
  author?: string;
  image?: {
    url: string;
    alt: string;
  };
  tags?: string[];
}

interface Post {
  frontmatter: Frontmatter;
  url?: string;
  content?: string;
}

interface BlogFetcherProps {
  postsPath?: string;
}

/**
 * BlogFetcher component - Client-side fetching of blog posts
 */
export function BlogFetcher({ postsPath = '/posts-data.json' }: BlogFetcherProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect will run on the client side when the component mounts
    const fetchPosts = async () => {
      try {
        // Fetch blog posts from static JSON file
        const response = await fetch(postsPath);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.statusText}`);
        }
        
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        console.error("Error fetching blog posts:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch blog posts");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [postsPath]);

  if (loading) return <div>Loading blog posts...</div>;
  if (error) return <div>Error loading blog posts: {error}</div>;
  if (!posts.length) return <div>No blog posts found.</div>;

  return (
    <div className="blog-list">
      <ul>
        {posts.map((post, index) => (
          <li key={index} className="post">
            <a href={post.url}>
              <h2>{post.frontmatter.title}</h2>
            </a>
            {post.frontmatter.pubDate && (
              <p className="date">{new Date(post.frontmatter.pubDate).toLocaleDateString()}</p>
            )}
            {post.frontmatter.description && (
              <p>{post.frontmatter.description}</p>
            )}
            {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
              <div className="tags">
                {post.frontmatter.tags.map(tag => (
                  <a href={`/tags/${tag}`} className="tag" key={tag}>
                    {tag}
                  </a>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BlogFetcher;
