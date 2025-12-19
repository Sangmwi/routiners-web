'use client';

import { useRef, useState, useCallback, useEffect, RefObject } from 'react';

interface UseDragScrollOptions {
  /** 드래그 활성화 여부 */
  enabled?: boolean;
  /** 스크롤 속도 배율 (기본: 2) */
  scrollSpeed?: number;
  /** 드래그로 간주할 최소 이동 거리 (px) */
  dragThreshold?: number;
}

interface UseDragScrollReturn<T extends HTMLElement> {
  /** 스크롤 컨테이너에 연결할 ref */
  containerRef: RefObject<T | null>;
  /** 현재 드래그 중인지 여부 */
  isDragging: boolean;
  /** 드래그 동작이 발생했는지 (클릭과 구분용) */
  hasDragged: boolean;
  /** 마우스 이벤트 핸들러들 */
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

/**
 * 드래그 스크롤 기능을 제공하는 커스텀 훅
 *
 * 마우스 드래그와 터치 스크롤을 지원하며,
 * 클릭과 드래그를 자동으로 구분합니다.
 *
 * @example
 * ```tsx
 * const { containerRef, handlers, hasDragged } = useDragScroll<HTMLDivElement>();
 *
 * return (
 *   <div ref={containerRef} {...handlers} className="overflow-x-auto">
 *     {children}
 *   </div>
 * );
 * ```
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>({
  enabled = true,
  scrollSpeed = 2,
  dragThreshold = 5,
}: UseDragScrollOptions = {}): UseDragScrollReturn<T> {
  const containerRef = useRef<T | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  // 드래그 상태를 ref로도 유지 (이벤트 리스너에서 최신 값 참조)
  const dragStateRef = useRef({ startX: 0, scrollLeft: 0 });

  // 마우스 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled || !containerRef.current) return;

    setIsDragging(true);
    setHasDragged(false);
    dragStateRef.current = {
      startX: e.pageX - containerRef.current.offsetLeft,
      scrollLeft: containerRef.current.scrollLeft,
    };
    e.preventDefault();
  }, [enabled]);

  // 마우스 드래그 중
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - dragStateRef.current.startX) * scrollSpeed;

    if (Math.abs(walk) > dragThreshold) {
      setHasDragged(true);
    }

    containerRef.current.scrollLeft = dragStateRef.current.scrollLeft - walk;
  }, [isDragging, scrollSpeed, dragThreshold]);

  // 마우스 드래그 종료
  const handleMouseUpOrLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 터치 드래그 시작
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || !containerRef.current) return;

    setIsDragging(true);
    setHasDragged(false);
    dragStateRef.current = {
      startX: e.touches[0].pageX - containerRef.current.offsetLeft,
      scrollLeft: containerRef.current.scrollLeft,
    };
  }, [enabled]);

  // 터치 드래그 중
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const x = e.touches[0].pageX - containerRef.current.offsetLeft;
    const walk = (x - dragStateRef.current.startX) * scrollSpeed;

    if (Math.abs(walk) > dragThreshold) {
      setHasDragged(true);
    }

    containerRef.current.scrollLeft = dragStateRef.current.scrollLeft - walk;
  }, [isDragging, scrollSpeed, dragThreshold]);

  // 터치 드래그 종료
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 커서 스타일 변경
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.style.cursor = isDragging ? 'grabbing' : 'grab';
  }, [isDragging, enabled]);

  // 드래그 중 클릭 이벤트 차단
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      if (hasDragged) {
        e.stopPropagation();
        e.preventDefault();
        setHasDragged(false);
      }
    };

    container.addEventListener('click', handleClick, true);
    return () => container.removeEventListener('click', handleClick, true);
  }, [hasDragged]);

  return {
    containerRef,
    isDragging,
    hasDragged,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUpOrLeave,
      onMouseLeave: handleMouseUpOrLeave,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
