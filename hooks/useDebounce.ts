'use client';

import { useState, useEffect } from 'react';

/**
 * useDebounce
 *
 * 값의 변경을 지연시켜 API 호출 최적화
 * @param value - 디바운스할 값
 * @param delay - 지연 시간 (ms), 기본값 500ms
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
