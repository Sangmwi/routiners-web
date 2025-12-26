'use client';

/**
 * Performance Optimization Hooks
 *
 * WebView 환경에서 렌더링 성능을 최적화하기 위한 훅들
 */

import { useCallback, useRef, useEffect, useState } from 'react';

// ============================================================================
// useDebounce
// ============================================================================

/**
 * 디바운스된 값 반환
 *
 * 빠른 연속 입력에서 마지막 값만 사용
 *
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// useThrottle
// ============================================================================

/**
 * 스로틀된 콜백 반환
 *
 * 일정 시간 내 최대 1회만 실행
 *
 * @example
 * const throttledScroll = useThrottle(handleScroll, 100);
 */
export function useThrottle<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const lastCallTimer = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback(...args);
      } else {
        // 마지막 호출 보장
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        lastCallTimer.current = setTimeout(() => {
          lastCall.current = Date.now();
          callback(...args);
        }, delay - (now - lastCall.current));
      }
    }) as T,
    [callback, delay]
  );
}

// ============================================================================
// useIntersectionObserver
// ============================================================================

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

/**
 * Intersection Observer 훅
 *
 * 요소가 뷰포트에 들어왔는지 감지
 * 레이지 로딩, 무한 스크롤에 사용
 *
 * @example
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   threshold: 0.1,
 *   freezeOnceVisible: true,
 * });
 */
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
      ([entry]) => setEntry(entry),
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [node, threshold, rootMargin, frozen]);

  return {
    ref: setNode,
    isIntersecting: entry?.isIntersecting ?? false,
    entry,
  };
}

// ============================================================================
// useVisibilityChange
// ============================================================================

/**
 * 페이지 가시성 변경 감지
 *
 * 백그라운드/포그라운드 전환 시 동작 제어
 *
 * @example
 * const isVisible = useVisibilityChange();
 *
 * useEffect(() => {
 *   if (isVisible) refetch();
 * }, [isVisible]);
 */
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

// ============================================================================
// useStableCallback
// ============================================================================

/**
 * 안정적인 콜백 레퍼런스 반환
 *
 * 콜백 내용이 바뀌어도 레퍼런스 유지 (리렌더링 방지)
 *
 * @example
 * const stableOnClick = useStableCallback(onClick);
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => callbackRef.current(...args)) as T,
    []
  );
}

// ============================================================================
// usePrevious
// ============================================================================

/**
 * 이전 렌더링의 값 반환
 *
 * 값 변경 비교에 사용
 *
 * @example
 * const prevCount = usePrevious(count);
 * if (prevCount !== count) { ... }
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
