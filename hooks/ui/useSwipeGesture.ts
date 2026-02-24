'use client';

import { useRef, useState, useCallback, RefObject } from 'react';

// ============================================================================
// Types
// ============================================================================

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
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

  const applyTransform = useCallback((deltaY: number) => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (modalRef.current) {
        modalRef.current.style.transform = `translateY(${deltaY}px)`;
        modalRef.current.style.transition = 'none';
      }
    });
  }, []);

  const handleDragStart = useCallback((clientY: number) => {
    if (!enabled) return;
    startYRef.current = clientY;
    deltaYRef.current = 0;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
    isDraggingRef.current = true;
    setIsDragging(true);
  }, [enabled]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDraggingRef.current || startYRef.current === null) return;
    const delta = clientY - startYRef.current;
    const clampedDelta = delta > 0 ? delta : 0;
    deltaYRef.current = clampedDelta;
    lastYRef.current = clientY;
    lastTimeRef.current = Date.now();
    applyTransform(clampedDelta);
  }, [applyTransform]);

  const handleDragEnd = useCallback(() => {
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
  }, [threshold, onSwipeClose]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    contentDraggingRef.current = false;
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
  }, []);

  // 드래그 핸들 전용 핸들러 (항상 동작)
  const handlers: SwipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    onTouchMove: (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    onTouchEnd: handleDragEnd,
    onMouseDown: (e: React.MouseEvent) => handleDragStart(e.clientY),
    onMouseMove: (e: React.MouseEvent) => handleDragMove(e.clientY),
    onMouseUp: handleDragEnd,
    onMouseLeave: () => {
      if (isDraggingRef.current) handleDragEnd();
    },
  };

  // 콘텐츠 영역 핸들러 (scrollTop === 0에서 아래로 당길 때만 활성화)
  const contentHandlers: SwipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      if (!enabled) return;
      const scrollEl = contentRef.current;
      if (scrollEl && scrollEl.scrollTop <= 0) {
        contentDraggingRef.current = true;
        handleDragStart(e.touches[0].clientY);
      }
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!contentDraggingRef.current) return;
      handleDragMove(e.touches[0].clientY);
      if (deltaYRef.current > 0) {
        e.preventDefault();
      }
    },
    onTouchEnd: () => {
      if (!contentDraggingRef.current) return;
      handleDragEnd();
    },
    onMouseDown: (e: React.MouseEvent) => {
      if (!enabled) return;
      const scrollEl = contentRef.current;
      if (scrollEl && scrollEl.scrollTop <= 0) {
        contentDraggingRef.current = true;
        handleDragStart(e.clientY);
      }
    },
    onMouseMove: (e: React.MouseEvent) => {
      if (!contentDraggingRef.current) return;
      handleDragMove(e.clientY);
    },
    onMouseUp: () => {
      if (!contentDraggingRef.current) return;
      handleDragEnd();
    },
    onMouseLeave: () => {
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
