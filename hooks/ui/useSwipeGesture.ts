'use client';

import { useState } from 'react';

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

interface UseSwipeGestureReturn {
  deltaY: number;
  isDragging: boolean;
  isSwipeClosing: boolean;
  isSnappingBack: boolean;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
  };
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

  const handleDragStart = (clientY: number) => {
    if (!enabled) return;
    setState({ startY: clientY, deltaY: 0, isDragging: true, lastY: clientY, lastTime: Date.now() });
  };

  const handleDragMove = (clientY: number) => {
    setState((prev) => {
      if (!prev.isDragging || prev.startY === null) return prev;
      const delta = clientY - prev.startY;
      return { ...prev, deltaY: delta > 0 ? delta : 0, lastY: clientY, lastTime: Date.now() };
    });
  };

  const handleDragEnd = () => {
    setState((prev) => {
      if (!prev.isDragging) return prev;

      // 스와이프 속도 계산 (px/ms)
      const now = Date.now();
      const timeDiff = prev.lastTime ? now - prev.lastTime : 100;
      const velocity = timeDiff > 0 ? prev.deltaY / Math.max(timeDiff, 50) : 0;

      if (prev.deltaY > threshold || (prev.deltaY > 30 && velocity > 0.5)) {
        // 스와이프 닫기: 임계치 초과 또는 빠른 스와이프(30px 이상 + 속도 0.5px/ms 이상)
        setIsSwipeClosing(true);
        onSwipeClose();
      } else if (prev.deltaY > 0) {
        // 임계치 미달: 스냅백 애니메이션으로 부드럽게 복귀
        setIsSnappingBack(true);
        setTimeout(() => setIsSnappingBack(false), ANIMATION_DURATION);
      }

      return { startY: null, deltaY: 0, isDragging: false, lastY: null, lastTime: null };
    });
  };

  const reset = () => {
    setState({ startY: null, deltaY: 0, isDragging: false, lastY: null, lastTime: null });
    setIsSwipeClosing(false);
    setIsSnappingBack(false);
  };

  const handlers = {
    onTouchStart: (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    onTouchMove: (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    onTouchEnd: handleDragEnd,
    onMouseDown: (e: React.MouseEvent) => handleDragStart(e.clientY),
    onMouseMove: (e: React.MouseEvent) => handleDragMove(e.clientY),
    onMouseUp: handleDragEnd,
    onMouseLeave: () => {
      if (state.isDragging) {
        setState({ startY: null, deltaY: 0, isDragging: false, lastY: null, lastTime: null });
      }
    },
  };

  return {
    deltaY: state.deltaY,
    isDragging: state.isDragging,
    isSwipeClosing,
    isSnappingBack,
    handlers,
    reset,
  };
}
