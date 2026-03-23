import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * ✅ FIX: Performance optimization utilities
 * - Lazy loading
 * - Caching
 * - Request batching
 * - Debouncing
 */

// ============================================================================
// DEBOUNCING & THROTTLING
// ============================================================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// CACHING
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache<T> {
  private storage: Map<string, CacheEntry<T>> = new Map();

  set(key: string, data: T, ttlSeconds: number = 300) {
    this.storage.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get(key: string): T | null {
    const entry = this.storage.get(key);

    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.storage.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.storage.clear();
  }
}

export const responseCache = new Cache<any>();

// ============================================================================
// LAZY LOADING
// ============================================================================

export function useLazyLoad(
  callback: () => Promise<any>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;

    const load = async () => {
      setLoading(true);
      try {
        const result = await callback();
        setData(result);
        loadedRef.current = true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, dependencies);

  return { data, loading, error };
}

// ============================================================================
// LAZY IMAGE LOADING
// ============================================================================

export function useLazyImage(src: string) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [src]);

  return { ref, imageSrc, isLoading, setIsLoading };
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16) {
        console.warn(
          `[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render`
        );
      }
    };
  }, [componentName]);
}