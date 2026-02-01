'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * 로딩 스피너 최소 표시 시간 보장 훅
 *
 * @description
 * 데이터가 너무 빨리 로드되어 스피너가 번쩍이는 것을 방지합니다.
 * 로딩이 시작되면 최소 minDuration(ms) 동안은 로딩 상태를 유지합니다.
 *
 * @param isFetching - 실제 로딩 상태
 * @param minDuration - 최소 표시 시간 (ms), 기본값 500
 * @returns showLoading - 표시할 로딩 상태
 */
export function useMinimumLoadingTime(
  isFetching: boolean,
  minDuration = 500
): boolean {
  const [showLoading, setShowLoading] = useState(false);
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isFetching) {
      // 로딩 시작: 즉시 표시
      startTimeRef.current = Date.now();
      setShowLoading(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } else if (showLoading) {
      // 로딩 완료: 최소 시간 보장
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining > 0) {
        timeoutRef.current = setTimeout(() => {
          setShowLoading(false);
        }, remaining);
      } else {
        setShowLoading(false);
      }
    }
  }, [isFetching, showLoading, minDuration]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return showLoading;
}
