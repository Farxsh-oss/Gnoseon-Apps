/**
 * Performance optimization utilities for Gnōseōn application
 * Provides lazy loading, virtualization, and memoization utilities
 */

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// Memoization utilities
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    
    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
  }) as T;
}

// Lazy loading hook
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    const load = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await loader();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    load();
    
    return () => {
      cancelled = true;
    };
  }, dependencies);
  
  return { data, loading, error };
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.disconnect();
    };
  }, [elementRef, options.threshold, hasIntersected]);
  
  return { isIntersecting, hasIntersected };
}

// Virtual list hook
export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }, [items.length, itemHeight, containerHeight, scrollTop, overscan]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
    }));
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    handleScroll,
    offsetY: visibleRange.startIndex * itemHeight,
  };
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  startTiming(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      
      this.metrics.get(name)!.push(duration);
      
      // Keep only last 100 measurements
      const measurements = this.metrics.get(name)!;
      if (measurements.length > 100) {
        measurements.shift();
      }
    };
  }
  
  getMetrics(name: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }
    
    return {
      average: measurements.reduce((sum, val) => sum + val, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      count: measurements.length,
    };
  }
  
  getAllMetrics(): Record<string, ReturnType<typeof this.getMetrics>> {
    const result: Record<string, ReturnType<typeof this.getMetrics>> = {};
    
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name);
    }
    
    return result;
  }
  
  clearMetrics(): void {
    this.metrics.clear();
  }
  
  // Observe performance metrics
  startObserving(): void {
    if ('PerformanceObserver' in window) {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('Navigation timing:', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              totalTime: navEntry.loadEventEnd - navEntry.fetchStart,
            });
          }
        }
      });
      
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
      
      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            console.log('Resource timing:', {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              size: resourceEntry.transferSize,
            });
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }
  
  stopObserving(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Component performance optimization hook
export function useComponentPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  const monitor = PerformanceMonitor.getInstance();
  
  useEffect(() => {
    renderCount.current++;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;
    
    if (renderCount.current > 1) {
      console.log(`${componentName} render #${renderCount.current}, time since last: ${timeSinceLastRender.toFixed(2)}ms`);
    }
  });
  
  const measureOperation = useCallback(<T extends (...args: any[]) => any>(operation: T, operationName: string) => {
    return (...args: Parameters<T>) => {
      const endTiming = monitor.startTiming(`${componentName}.${operationName}`);
      try {
        const result = operation(...args);
        endTiming();
        return result;
      } catch (error) {
        endTiming();
        throw error;
      }
    };
  }, [componentName, monitor]);
  
  return {
    renderCount: renderCount.current,
    measureOperation,
    getMetrics: () => monitor.getMetrics(componentName),
  };
}

// Image lazy loading component
export function LazyImage({
  src,
  alt,
  placeholder,
  className,
  onLoad,
  onError,
  ...restProps
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  placeholder?: string;
}) {
  const [imageSrc, setImageSrc] = useState<string>(placeholder || '');
  const [loading, setLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { hasIntersected } = useIntersectionObserver(imgRef as React.RefObject<Element>, {
    threshold: 0.1,
  });
  
  useEffect(() => {
    if (hasIntersected && src && imageSrc !== src) {
      const img = new Image();
      
      img.onload = () => {
        if (src) {
          setImageSrc(src);
        }
        setLoading(false);
        if (onLoad) {
          onLoad({ target: img } as any);
        }
      };
      
      img.onerror = () => {
        setLoading(false);
        if (onError) {
          onError({ target: img } as any);
        }
      };
      
      img.src = src;
    }
  }, [hasIntersected, src, imageSrc, onLoad, onError]);
  
  return React.createElement('img', {
    ref: imgRef,
    src: imageSrc,
    alt: alt,
    className: className,
    style: {
      opacity: loading ? 0.5 : 1,
      transition: 'opacity 0.3s ease',
    },
    ...restProps,
  });
}

// Bundle size monitoring
export function useBundleSizeMonitor() {
  const [bundleInfo, setBundleInfo] = useState<{
    jsSize: number;
    cssSize: number;
    totalSize: number;
  } | null>(null);
  
  useEffect(() => {
    const measureBundleSize = () => {
      const scripts = document.querySelectorAll('script[src]');
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      
      let jsSize = 0;
      let cssSize = 0;
      
      scripts.forEach(script => {
        const scriptElement = script as HTMLScriptElement;
        if (scriptElement.src.includes('chunk') || scriptElement.src.includes('bundle')) {
          // This is an approximation - actual size would need to be fetched
          jsSize += 50000; // Estimated size
        }
      });
      
      links.forEach(link => {
        const linkElement = link as HTMLLinkElement;
        if (linkElement.href.includes('chunk') || linkElement.href.includes('bundle')) {
          cssSize += 10000; // Estimated size
        }
      });
      
      setBundleInfo({
        jsSize,
        cssSize,
        totalSize: jsSize + cssSize,
      });
    };
    
    // Measure after page load
    if (document.readyState === 'complete') {
      measureBundleSize();
    } else {
      window.addEventListener('load', measureBundleSize);
      return () => window.removeEventListener('load', measureBundleSize);
    }
  }, []);
  
  return bundleInfo;
}

// Memory usage monitoring
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);
  
  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };
    
    updateMemoryInfo();
    
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return memoryInfo;
}

// Performance optimization utilities
export const performanceUtils = {
  memoize,
  debounce,
  throttle,
  PerformanceMonitor,
  useLazyLoad,
  useIntersectionObserver,
  useVirtualList,
  useComponentPerformance,
  LazyImage,
  useBundleSizeMonitor,
  useMemoryMonitor,
};

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
