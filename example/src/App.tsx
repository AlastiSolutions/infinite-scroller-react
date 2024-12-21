import React, { useState, useCallback, useRef } from 'react';
import InfiniteScroll from 'infinite-scroller-react';
import './App.css';

interface Post {
  id: number;
  title: string;
  body: string;
}

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const fetchPosts = async (pageNumber: number): Promise<Post[]> => {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/posts?_page=${pageNumber}&_limit=10`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    return response.json();
  };

  const loadMore = async () => {
    if (isFetchingRef.current || !hasMore) return;
    
    isFetchingRef.current = true;
    setIsLoading(true);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newPosts = await fetchPosts(pageRef.current);
      
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
        pageRef.current += 1;
      }
    } catch (err) {
      setError(err as Error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleRefresh = async () => {
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setIsLoading(true);
    
    try {
      // Reset state
      pageRef.current = 1;
      setHasMore(true);
      
      // Fetch fresh data
      const freshPosts = await fetchPosts(1);
      setPosts(freshPosts);
      pageRef.current = 2;
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleError = useCallback((error: Error) => {
    setError(error);
    console.error('Error in infinite scroll:', error);
  }, []);

  // Custom loading components
  const LoadingSpinner = () => (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Loading more posts...</p>
    </div>
  );

  const RefreshIndicator = () => (
    <div className="refresh-indicator">
      <div className="refresh-icon">↓</div>
      <p>Release to refresh</p>
    </div>
  );

  const EndMessage = () => (
    <div className="end-message">
      <p>No more posts to load</p>
    </div>
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Infinite Scroll Demo</h1>
        {error && (
          <div className="error-message">
            {error.message}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
      </header>

      <div className="content-container" id="scrollable-container">
        <InfiniteScroll
          loadMore={loadMore}
          hasMore={hasMore}
          isLoading={isLoading}
          scrollableTarget="scrollable-container"
          initialLoad={true}
          onError={handleError}
          loadingComponent={<LoadingSpinner />}
          endMessage={<EndMessage />}
          pullDownToRefresh={true}
          pullDownThreshold={100}
          refreshComponent={<RefreshIndicator />}
          onRefresh={handleRefresh}
          scrollThrottle={425}
          className="infinite-scroll-container"
        >
          <div className="posts-grid">
            {posts.map(post => (
              <div key={post.id} className="post-card">
                <h2>{post.title}</h2>
                <p>{post.body}</p>
                <span className="post-id">#{post.id}</span>
              </div>
            ))}
          </div>
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default App;
