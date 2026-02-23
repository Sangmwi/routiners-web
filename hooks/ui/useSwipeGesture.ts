'use client';

import { useRef, useState, useCallback, RefObject } from 'react';

// ============================================================================
// Types
// ============================================================================

interface SwipeState {
  startY: number | null;
  deltaY: number;
  isDragging: boolean;
  lastY: number | null;
  lastTime: number | null;
}

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
  deltaY: number;
  isDragging: boolean;
  isSwipeClosing: boolean;
  isSnappingBack: boolean;
  /** 드래그 핸들 전용 핸들러 (항상 드래그 시작) */
  handlers: SwipeHandlers;
  /** 스크롤 콘텐츠 영역 핸들러 (scrollTop === 0일 때만 드래그 시작) */
  contentHandlers: SwipeHandlers;
  /** 스크롤 콘텐츠 영역 ref */
  contentRef: RefObject<HTMLDivElement | null>;
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
 * 스와이프 제스처 훅
 * 터치 + 마우스 드래그 통합 지원
 *
 * - handlers: 드래그 핸들 전용 (항상 동작)
 * - contentHandlers + contentRef: 스크롤 콘텐츠 영역 (스크롤 최상단에서만 dismiss)
 */
export function useSwipeGesture(
  enabled: boolean,
  threshold: number,
  onSwipeClose: () => void
): UseSwipeGestureReturn {
  const [state, setState] = useState<SwipeState>({
    startY: null,
    deltaY: 0,
    isDragging: false,
    lastY: null,
    lastTime: null,
  });
  const [isSwipeClosing, setIsSwipeClosing] = useState(false);
  const [isSnappingBack, setIsSnappingBack] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  // 콘텐츠 영역 드래그가 활성화되었는지 추적 (스크롤 최상단에서 시작한 경우에만)
  const contentDraggingRef = useRef(false);

  const handleDragStart = useCallback((clientY: number) => {
    if (!enabled) return;
    setState({ startY: clientY, deltaY: 0, isDragging: true, lastY: clientY, lastTime: Date.now() });
  }, [enabled]);

  const handleDragMove = useCallback((clientY: number) => {
    setState((prev) => {
      if (!prev.isDragging || prev.startY === null) return prev;
      const delta = clientY - prev.startY;
      return { ...prev, deltaY: delta > 0 ? delta : 0, lastY: clientY, lastTime: Date.now() };
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    contentDraggingRef.current = false;
    setState((prev) => {
      if (!prev.isDragging) return prev;

      // 스와이프 속도 계산 (px/ms)
      const now = Date.now();
      const timeDiff = prev.lastTime ? now - prev.lastTime : 100;
      const velocity = timeDiff > 0 ? prev.deltaY / Math.max(timeDiff, 50) : 0;

      if (prev.deltaY > threshold || (prev.deltaY > 30 && velocity > 0.5)) {
        setIsSwipeClosing(true);
        onSwipeClose();
      } else if (prev.deltaY > 0) {
        setIsSnappingBack(true);
        setTimeout(() => setIsSnappingBack(false), ANIMATION_DURATION);
      }

      return { startY: null, deltaY: 0, isDragging: false, lastY: null, lastTime: null };
    });
  }, [threshold, onSwipeClose]);

  const reset = useCallback(() => {
    contentDraggingRef.current = false;
    setState({ startY: null, deltaY: 0, isDragging: false, lastY: null, lastTime: null });
    setIsSwipeClosing(false);
    setIsSnappingBack(false);
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
      // 드래그 중 마우스 이탈 시 dragEnd로 처리 (스냅백/닫기 판정 포함)
      if (state.isDragging) handleDragEnd();
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
      // 드래그 중이면 스크롤 방지
      if (state.deltaY > 0) {
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
      // 콘텐츠 드래그 중 마우스 이탈 시 dragEnd로 처리
      if (contentDraggingRef.current && state.isDragging) handleDragEnd();
    },
  };

  return {
    deltaY: state.deltaY,
    isDragging: state.isDragging,
    isSwipeClosing,
    isSnappingBack,
    handlers,
    contentHandlers,
    contentRef,
    reset,
  };
}
