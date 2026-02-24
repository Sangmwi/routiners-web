'use client';

import { useRef, useState, RefObject } from 'react';

// ============================================================================
// Types
// ============================================================================

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

interface UseSwipeGestureReturn {
  isDragging: boolean;
  isSwipeClosing: boolean;
  isSnappingBack: boolean;
  /** 드래그 핸들 전용 핸들러 (항상 드래그 시작) */
  handlers: SwipeHandlers;
  /** 스크롤 콘텐츠 영역 핸들러 (scrollTop === 0일 때만 드래그 시작) */
  contentHandlers: SwipeHandlers;
  /** 스크롤 콘텐츠 영역 ref */
  contentRef: RefObject<HTMLDivElement | null>;
  /** 모달 컨테이너 ref — rAF로 transform을 직접 조작 */
  modalRef: RefObject<HTMLDivElement | null>;
  reset: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const ANIMATION_DURATION = 200;

// ============================================================================
// Hook
// ============================================================================

/**
 * 스와이프 제스처 훅 (ref + rAF 기반)
 *
 * 드래그 중 React 리렌더 없이 rAF로 DOM transform을 직접 조작하여
 * 120Hz 디스플레이에서도 부드러운 드래그 동작 보장
 *
 * - handlers: 드래그 핸들 전용 (항상 동작)
 * - contentHandlers + contentRef: 스크롤 콘텐츠 영역 (스크롤 최상단에서만 dismiss)
 * - modalRef: 모달 컨테이너 div에 연결 (rAF transform 적용 대상)
 */
export function useSwipeGesture(
  enabled: boolean,
  threshold: number,
  onSwipeClose: () => void
): UseSwipeGestureReturn {
  // 드래그 끝 결과만 state로 관리 (close/snapback 전환 애니메이션 트리거용)
  const [isDragging, setIsDragging] = useState(false);
  const [isSwipeClosing, setIsSwipeClosing] = useState(false);
  const [isSnappingBack, setIsSnappingBack] = useState(false);

  // 드래그 중 고빈도 값은 ref로 추적 (리렌더 없음)
  const startYRef = useRef<number | null>(null);
  const deltaYRef = useRef(0);
  const lastYRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const rafRef = useRef(0);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const contentDraggingRef = useRef(false);
  const contentTouchStartYRef = useRef<number | null>(null);

  const applyTransform = (deltaY: number) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (modalRef.current) {
        modalRef.current.style.transform = `translateY(${deltaY}px)`;
        modalRef.current.style.transition = 'none';
      }
    });
  };

  const handleDragStart = (clientY: number) => {
    if (!enabled) return;
    startYRef.current = clientY;
    deltaYRef.current = 0;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDraggingRef.current || startYRef.current === null) return;
    const delta = clientY - startYRef.current;
    const clampedDelta = delta > 0 ? delta : 0;
    deltaYRef.current = clampedDelta;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
    applyTransform(clampedDelta);
  };

  const handleDragEnd = () => {
    contentDraggingRef.current = false;
    if (!isDraggingRef.current) return;

    cancelAnimationFrame(rafRef.current);
    isDraggingRef.current = false;

    const deltaY = deltaYRef.current;
    const now = Date.now();
    const timeDiff = lastTimeRef.current ? now - lastTimeRef.current : 100;
    const velocity = timeDiff > 0 ? deltaY / Math.max(timeDiff, 50) : 0;

    if (deltaY > threshold || (deltaY > 30 && velocity > 0.5)) {
      // 스와이프 닫기
      setIsSwipeClosing(true);
      setIsDragging(false);
      onSwipeClose();
    } else if (deltaY > 0) {
      // 스냅백: CSS transition으로 부드러운 복귀
      if (modalRef.current) {
        modalRef.current.style.transform = 'translateY(0)';
        modalRef.current.style.transition = `transform ${ANIMATION_DURATION}ms ease-out`;
      }
      setIsSnappingBack(true);
      setIsDragging(false);
      setTimeout(() => setIsSnappingBack(false), ANIMATION_DURATION);
    } else {
      setIsDragging(false);
    }

    // ref 초기화
    startYRef.current = null;
    deltaYRef.current = 0;
    lastYRef.current = null;
    lastTimeRef.current = null;
  };

  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    contentDraggingRef.current = false;
    contentTouchStartYRef.current = null;
    isDraggingRef.current = false;
    startYRef.current = null;
    deltaYRef.current = 0;
    lastYRef.current = null;
    lastTimeRef.current = null;
    setIsDragging(false);
    setIsSwipeClosing(false);
    setIsSnappingBack(false);
    if (modalRef.current) {
      modalRef.current.style.transform = '';
      modalRef.current.style.transition = '';
    }
  };

  // 드래그 핸들 전용 핸들러 (항상 동작)
  const handlers: SwipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    onTouchMove: (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    onTouchEnd: (_e: React.TouchEvent) => handleDragEnd(),
    onMouseDown: (e: React.MouseEvent) => handleDragStart(e.clientY),
    onMouseMove: (e: React.MouseEvent) => handleDragMove(e.clientY),
    onMouseUp: (_e: React.MouseEvent) => handleDragEnd(),
    onMouseLeave: (_e: React.MouseEvent) => {
      if (isDraggingRef.current) handleDragEnd();
    },
  };

  // 콘텐츠 영역 핸들러
  // - stopPropagation으로 부모 handlers 버블링 차단 (스크롤/드래그 충돌 방지)
  // - scrollTop === 0이면 즉시 드래그, scrollTop > 0이면 네이티브 스크롤 후 0 도달 시 전환
  const contentHandlers: SwipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      e.stopPropagation();
      if (!enabled) return;
      const clientY = e.touches[0].clientY;
      contentTouchStartYRef.current = clientY;
      const scrollEl = contentRef.current;
      if (scrollEl && scrollEl.scrollTop <= 0) {
        contentDraggingRef.current = true;
        handleDragStart(clientY);
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      e.stopPropagation();
      if (!enabled) return;
      const clientY = e.touches[0].clientY;
      if (contentDraggingRef.current) {
        handleDragMove(clientY);
        if (deltaYRef.current > 0) {
          e.preventDefault();
        }
        return;
      }
      // 스크롤→스와이프 중간 전환: scrollTop이 0에 도달하고 아래로 당기는 중
      const scrollEl = contentRef.current;
      if (
        scrollEl &&
        scrollEl.scrollTop <= 0 &&
        contentTouchStartYRef.current !== null &&
        clientY > contentTouchStartYRef.current
      ) {
        contentDraggingRef.current = true;
        handleDragStart(clientY);
        e.preventDefault();
      }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.stopPropagation();
      contentTouchStartYRef.current = null;
      if (!contentDraggingRef.current) return;
      handleDragEnd();
    },
    onMouseDown: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!enabled) return;
      contentTouchStartYRef.current = e.clientY;
      const scrollEl = contentRef.current;
      if (scrollEl && scrollEl.scrollTop <= 0) {
        contentDraggingRef.current = true;
        handleDragStart(e.clientY);
      }
    },
    onMouseMove: (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!enabled) return;
      const clientY = e.clientY;
      if (contentDraggingRef.current) {
        handleDragMove(clientY);
        return;
      }
      const scrollEl = contentRef.current;
      if (
        scrollEl &&
        scrollEl.scrollTop <= 0 &&
        contentTouchStartYRef.current !== null &&
        clientY > contentTouchStartYRef.current
      ) {
        contentDraggingRef.current = true;
        handleDragStart(clientY);
      }
    },
    onMouseUp: (e: React.MouseEvent) => {
      e.stopPropagation();
      contentTouchStartYRef.current = null;
      if (!contentDraggingRef.current) return;
      handleDragEnd();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      e.stopPropagation();
      contentTouchStartYRef.current = null;
      if (contentDraggingRef.current && isDraggingRef.current) handleDragEnd();
    },
  };

  return {
    isDragging,
    isSwipeClosing,
    isSnappingBack,
    handlers,
    contentHandlers,
    contentRef,
    modalRef,
    reset,
  };
}
