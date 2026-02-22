'use client';

import { useEffect, useRef, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

export function useThrottle<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number,
): T {
  const lastCall = useRef(0);
  const lastCallTimer = useRef<NodeJS.Timeout | null>(null);

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback(...args);
      return;
    }

    if (lastCallTimer.current) {
      clearTimeout(lastCallTimer.current);
    }

    lastCallTimer.current = setTimeout(() => {
      lastCall.current = Date.now();
      callback(...args);
    }, delay - (now - lastCall.current));
  };

  return throttled as T;
}

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver<T extends Element>({
  threshold = 0,
  rootMargin = '0px',
  freezeOnceVisible = false,
}: UseIntersectionObserverOptions = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = useState<T | null>(null);

  const frozen = entry?.isIntersecting && freezeOnceVisible;

  useEffect(() => {
    if (!node || frozen) return;

    const observer = new IntersectionObserver(
      ([nextEntry]) => setEntry(nextEntry),
      { threshold, rootMargin },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [frozen, node, rootMargin, threshold]);

  return {
    ref: setNode,
    isIntersecting: entry?.isIntersecting ?? false,
    entry,
  };
}

export function useVisibilityChange(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const stableCallback = (...args: Parameters<T>) => callbackRef.current(...args);
  return stableCallback as T;
}
