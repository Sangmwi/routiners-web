'use client';

import { useState, useEffect, useCallback, RefObject } from 'react';

interface UseScrollProgressOptions {
  /** 인디케이터 자동 숨김 딜레이 (ms) */
  hideDelay?: number;
}

interface UseScrollProgressReturn {
  /** 스크롤 진행도 (0-100) */
  progress: number;
  /** 인디케이터 표시 여부 */
  isVisible: boolean;
}

/**
 * 스크롤 진행도를 추적하는 커스텀 훅
 *
 * 스크롤 위치를 기반으로 진행도를 계산하고,
 * 스크롤 후 일정 시간이 지나면 인디케이터를 숨깁니다.
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { progress, isVisible } = useScrollProgress(containerRef);
 *
 * return (
 *   <>
 *     <div ref={containerRef} className="overflow-x-auto">
 *       {children}
 *     </div>
 *     {isVisible && <ProgressBar value={progress} />}
 *   </>
 * );
 * ```
 */
export function useScrollProgress<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  { hideDelay = 1500 }: UseScrollProgressOptions = {}
): UseScrollProgressReturn {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let hideTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      const scrollWidth = container.scrollWidth - container.clientWidth;
      const currentScroll = container.scrollLeft;
      const newProgress = scrollWidth > 0 ? (currentScroll / scrollWidth) * 100 : 0;

      setProgress(newProgress);
      setIsVisible(true);

      // 기존 타이머 취소
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }

      // 일정 시간 후 인디케이터 숨김
      hideTimeout = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [containerRef, hideDelay]);

  return { progress, isVisible };
}
