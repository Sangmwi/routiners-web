'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * 채팅 자동 스크롤 훅
 *
 * @description
 * - 최초 렌더 시 하단으로 즉시 스크롤
 * - 이후 업데이트 시 하단 근처에 있을 때만 부드럽게 스크롤
 *
 * @param scrollContainerRef - 스크롤 컨테이너 ref
 * @param bottomRef - 하단 앵커 ref
 * @param dependencies - 스크롤 트리거 의존성 배열
 */
export function useChatAutoScroll(
  scrollContainerRef: RefObject<HTMLDivElement | null>,
  bottomRef: RefObject<HTMLDivElement | null>,
  dependencies: unknown[]
): void {
  const hasInitialScrolled = useRef(false);

  useEffect(() => {
    // 최초 렌더: 하단으로 즉시 스크롤
    if (!hasInitialScrolled.current) {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
      hasInitialScrolled.current = true;
      return;
    }

    // 이후 업데이트: 하단 근처일 때만 자동 스크롤
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 150;

    if (isNearBottom) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
