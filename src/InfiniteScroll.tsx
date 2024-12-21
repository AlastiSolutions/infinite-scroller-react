import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface InfiniteScrollProps {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading?: boolean;
  threshold?: number;
  loader?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  scrollableTarget?: string | HTMLElement;
  initialLoad?: boolean;
  onError?: (error: Error) => void;
  loadingComponent?: React.ReactNode;
  endMessage?: React.ReactNode;
  pullDownToRefresh?: boolean;
  pullDownThreshold?: number;
  refreshComponent?: React.ReactNode;
  onRefresh?: () => Promise<void>;
  scrollThrottle?: number;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  loadMore,
  hasMore,
  isLoading = false,
  threshold = 100,
  loader = null,
  children,
  className,
  scrollableTarget,
  initialLoad = true,
  onError,
  loadingComponent = loader,
  endMessage,
  pullDownToRefresh = false,
  pullDownThreshold = 100,
  refreshComponent,
  onRefresh,
  scrollThrottle = 150,
}) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPullingDown, setIsPullingDown] = useState(false);
  const [pullDownDistance, setPullDownDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const startY = useRef<number | null>(null);
  const isRefreshing = useRef(false);

  const getScrollableTarget = useCallback(() => {
    if (!scrollableTarget) return window;
    if (typeof scrollableTarget === 'string') {
      return document.getElementById(scrollableTarget);
    }
    return scrollableTarget;
  }, [scrollableTarget]);

  const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  const checkScrollPosition = useCallback(() => {
    if (!containerRef.current || loadingRef.current || !hasMore) return;

    const container = containerRef.current;
    const scrollTarget = getScrollableTarget();
    
    if (!scrollTarget) return;

    let scrollPosition: number;
    let bottomPosition: number;

    if (scrollTarget === window) {
      scrollPosition = window.innerHeight + window.scrollY;
      bottomPosition = container.offsetTop + container.offsetHeight;
    } else {
      const element = scrollTarget as HTMLElement;
      scrollPosition = element.clientHeight + element.scrollTop;
      bottomPosition = element.scrollHeight;
    }

    if (bottomPosition - scrollPosition <= threshold) {
      setShouldLoad(true);
    }
  }, [hasMore, threshold, getScrollableTarget]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!pullDownToRefresh || !onRefresh || isRefreshing.current) return;
    
    const scrollTarget = getScrollableTarget();
    const scrollTop = scrollTarget === window 
      ? window.scrollY || document.documentElement.scrollTop
      : (scrollTarget as HTMLElement).scrollTop;
    
    // Only allow pull to refresh when we're at the absolute top
    if (scrollTop <= 0) {
      const touch = e.touches[0];
      startY.current = touch.clientY;
      setIsPullingDown(true);
    }
  }, [pullDownToRefresh, onRefresh, getScrollableTarget]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pullDownToRefresh || !onRefresh || !startY.current || isRefreshing.current) return;
    
    const scrollTarget = getScrollableTarget();
    const scrollTop = scrollTarget === window 
      ? window.scrollY || document.documentElement.scrollTop
      : (scrollTarget as HTMLElement).scrollTop;
    
    // If we've scrolled down at all, cancel the pull to refresh
    if (scrollTop > 0) {
      startY.current = null;
      setPullDownDistance(0);
      setIsPullingDown(false);
      return;
    }
    
    const touch = e.touches[0];
    const distance = touch.clientY - startY.current;
    
    if (distance > 0) {
      // Only prevent default if we're actually pulling down
      e.preventDefault();
      setPullDownDistance(Math.min(distance * 0.5, pullDownThreshold));
    } else {
      // Allow normal scroll behavior for upward scrolls
      startY.current = null;
      setPullDownDistance(0);
      setIsPullingDown(false);
    }
  }, [pullDownToRefresh, onRefresh, pullDownThreshold, getScrollableTarget]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullDownToRefresh || !onRefresh || !startY.current || isRefreshing.current) return;
    
    if (pullDownDistance >= pullDownThreshold) {
      isRefreshing.current = true;
      try {
        await onRefresh();
      } catch (error) {
        onError?.(error as Error);
      } finally {
        isRefreshing.current = false;
      }
    }
    
    startY.current = null;
    setPullDownDistance(0);
    setIsPullingDown(false);
  }, [pullDownToRefresh, onRefresh, pullDownDistance, pullDownThreshold, onError]);

  useEffect(() => {
    const scrollTarget = getScrollableTarget();
    if (!scrollTarget) return;

    const throttledCheckScroll = throttle(checkScrollPosition, scrollThrottle);
    scrollTarget.addEventListener('scroll', throttledCheckScroll);
    window.addEventListener('resize', throttledCheckScroll);

    if (pullDownToRefresh) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      scrollTarget.removeEventListener('scroll', throttledCheckScroll);
      window.removeEventListener('resize', throttledCheckScroll);
      
      if (pullDownToRefresh) {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [
    checkScrollPosition,
    pullDownToRefresh,
    getScrollableTarget,
    scrollThrottle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  ]);

  useEffect(() => {
    const loadMoreItems = async () => {
      if (!shouldLoad || loadingRef.current || !hasMore) return;

      loadingRef.current = true;
      try {
        await loadMore();
      } catch (error) {
        onError?.(error as Error);
      }
      loadingRef.current = false;
      setShouldLoad(false);
    };

    loadMoreItems();
  }, [shouldLoad, loadMore, hasMore, onError]);

  // Initial load
  useEffect(() => {
    const initialLoadData = async () => {
      if (initialLoad && hasMore && !loadingRef.current && !isRefreshing.current) {
        loadingRef.current = true;
        try {
          await loadMore();
        } catch (error) {
          onError?.(error as Error);
        } finally {
          loadingRef.current = false;
        }
      }
    };
    initialLoadData();
  }, []); // Only run once on mount

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{
        transform: pullDownDistance > 0 ? `translateY(${pullDownDistance}px)` : undefined,
        transition: pullDownDistance > 0 ? 'none' : 'transform 0.2s ease-out'
      }}
    >
      {isPullingDown && refreshComponent}
      {children}
      {isLoading && loadingComponent}
      {!hasMore && endMessage}
    </div>
  );
};

export default InfiniteScroll;
