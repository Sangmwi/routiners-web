'use client';

import { useRef } from 'react';

/**
 * useThrottle
 *
 * 고빈도 콜백을 지정된 간격(ms)으로 제한하는 훅
 * trailing 호출을 보장하여 마지막 값이 누락되지 않음
 *
 * @example
 * const throttledScroll = useThrottle((index: number) => {
 *   setCurrentIndex(index);
 * }, 100);
 */
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
