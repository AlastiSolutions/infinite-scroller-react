# React Infinite Scroll Component

A highly customizable, TypeScript-based infinite scroll component for React applications with pull-to-refresh functionality.

## Features

- 🔄 Infinite scrolling with customizable threshold
- ⬇️ Pull-to-refresh support for mobile devices
- 📱 Custom scrollable container support
- 🎨 Fully customizable loading and error states
- 🔧 TypeScript support
- ⚡ Performance optimized with throttling
- 🎯 Error boundary integration
- 📦 Zero dependencies (except React)

## Installation

```bash
npm install react-infinity-scroll
# or
yarn add react-infinity-scroll
```

## Basic Usage

```tsx
import { InfiniteScroll } from 'react-infinity-scroll';

function MyComponent() {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = async () => {
    setIsLoading(true);
    try {
      const newItems = await fetchMoreItems();
      setItems(prev => [...prev, ...newItems]);
      setHasMore(newItems.length > 0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <InfiniteScroll
      loadMore={loadMore}
      hasMore={hasMore}
      isLoading={isLoading}
      loader={<div>Loading...</div>}
    >
      {items.map(item => (
        <div key={item.id}>{item.content}</div>
      ))}
    </InfiniteScroll>
  );
}
```

## Advanced Usage

### With Pull-to-Refresh

```tsx
<InfiniteScroll
  loadMore={loadMore}
  hasMore={hasMore}
  isLoading={isLoading}
  pullDownToRefresh={true}
  pullDownThreshold={100}
  onRefresh={handleRefresh}
  refreshComponent={<div>Pull to refresh...</div>}
  onError={handleError}
>
  {/* Your content */}
</InfiniteScroll>
```

### With Custom Scrollable Container

```tsx
<div id="scrollable-container" style={{ height: '500px', overflow: 'auto' }}>
  <InfiniteScroll
    loadMore={loadMore}
    hasMore={hasMore}
    scrollableTarget="scrollable-container"
    threshold={200}
    scrollThrottle={150}
  >
    {/* Your content */}
  </InfiniteScroll>
</div>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `loadMore` | `() => Promise<void>` | Yes | - | Function to load more items |
| `hasMore` | `boolean` | Yes | - | Whether there are more items to load |
| `isLoading` | `boolean` | No | `false` | Loading state |
| `threshold` | `number` | No | `100` | Distance from bottom (in px) to trigger loading |
| `loader` | `ReactNode` | No | `null` | Loading indicator component |
| `className` | `string` | No | - | CSS class for the container |
| `scrollableTarget` | `string \| HTMLElement` | No | `window` | Custom scrollable container |
| `initialLoad` | `boolean` | No | `true` | Whether to load data on mount |
| `onError` | `(error: Error) => void` | No | - | Error handler callback |
| `loadingComponent` | `ReactNode` | No | `loader` | Custom loading component |
| `endMessage` | `ReactNode` | No | - | Message shown when no more items |
| `pullDownToRefresh` | `boolean` | No | `false` | Enable pull-to-refresh |
| `pullDownThreshold` | `number` | No | `100` | Pull distance to trigger refresh |
| `refreshComponent` | `ReactNode` | No | - | Pull-to-refresh indicator |
| `onRefresh` | `() => Promise<void>` | No | - | Refresh callback function |
| `scrollThrottle` | `number` | No | `150` | Scroll event throttle in ms |

## Best Practices

1. **Error Handling**
   ```tsx
   const handleError = (error: Error) => {
     console.error('Loading failed:', error);
     // Show user-friendly error message
   };
   ```

2. **Loading States**
   ```tsx
   const LoadingSpinner = () => (
     <div className="loading-spinner">
       <div className="spinner"></div>
       <p>Loading more items...</p>
     </div>
   );
   ```

3. **Pull-to-Refresh Implementation**
   ```tsx
   const handleRefresh = async () => {
     // Reset state
     setPage(1);
     setHasMore(true);
     
     // Fetch fresh data
     const freshData = await fetchData(1);
     setItems(freshData);
   };
   ```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari
- Chrome for Android

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
