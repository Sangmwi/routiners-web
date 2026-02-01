'use client';

import { useEffect, useRef, useLayoutEffect, type RefObject } from 'react';

interface InfiniteScrollOptions {
  /** 다음 페이지 존재 여부 */
  hasNextPage?: boolean;
  /** 다음 페이지 로딩 중 여부 */
  isFetchingNextPage?: boolean;
  /** 다음 페이지 로드 함수 */
  onLoadMore?: () => void;
}

/**
 * 무한스크롤 IntersectionObserver 훅
 *
 * @description
 * - 상단 센티널이 뷰포트에 진입하면 이전 메시지를 로드
 * - 로드 후 스크롤 위치를 복원하여 사용자 경험 유지
 *
 * @param scrollContainerRef - 스크롤 컨테이너 ref
 * @param topSentinelRef - 상단 센티널 ref (트리거)
 * @param options - 무한스크롤 옵션
 */
export function useInfiniteScrollObserver(
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  topSentinelRef: RefObject<HTMLDivElement | null>,
  options: InfiniteScrollOptions
): void {
  const { hasNextPage, isFetchingNextPage, onLoadMore } = options;
  const prevScrollHeightRef = useRef<number>(0);

  // IntersectionObserver로 상단 도달 감지
  useEffect(() => {
    if (!hasNextPage || !onLoadMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          const container = scrollContainerRef.current;
          if (container) {
            prevScrollHeightRef.current = container.scrollHeight;
          }
          onLoadMore();
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 }
    );

    if (topSentinelRef.current) {
      observer.observe(topSentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore, scrollContainerRef, topSentinelRef]);

  // 이전 메시지 로드 후 스크롤 위치 복원
  useLayoutEffect(() => {
    if (!isFetchingNextPage && prevScrollHeightRef.current > 0) {
      const container = scrollContainerRef.current;
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop += newScrollHeight - prevScrollHeightRef.current;
      }
      prevScrollHeightRef.current = 0;
    }
  }, [isFetchingNextPage, scrollContainerRef]);
}
