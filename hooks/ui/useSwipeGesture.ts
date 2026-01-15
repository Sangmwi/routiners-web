'use client';

import { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

interface SwipeState {
  startY: number | null;
  deltaY: number;
  isDragging: boolean;
}

interface UseSwipeGestureReturn {
  deltaY: number;
  isDragging: boolean;
  isSwipeClosing: boolean;
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
  });
  const [isSwipeClosing, setIsSwipeClosing] = useState(false);

  const handleDragStart = useCallback(
    (clientY: number) => {
      if (!enabled) return;
      setState({ startY: clientY, deltaY: 0, isDragging: true });
    },
    [enabled]
  );

  const handleDragMove = useCallback((clientY: number) => {
    setState((prev) => {
      if (!prev.isDragging || prev.startY === null) return prev;
      const delta = clientY - prev.startY;
      return { ...prev, deltaY: delta > 0 ? delta : 0 };
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setState((prev) => {
      if (!prev.isDragging) return prev;

      if (prev.deltaY > threshold) {
        // 스와이프 닫기: isSwipeClosing=true 유지한 채 onSwipeClose 호출
        // isSwipeClosing은 모달 닫힌 후 reset()에서 리셋됨
        setIsSwipeClosing(true);
        onSwipeClose();
      }

      return { startY: null, deltaY: 0, isDragging: false };
    });
  }, [threshold, onSwipeClose]);

  const reset = useCallback(() => {
    setState({ startY: null, deltaY: 0, isDragging: false });
    setIsSwipeClosing(false);
  }, []);

  const handlers = {
    onTouchStart: (e: React.TouchEvent) => handleDragStart(e.touches[0].clientY),
    onTouchMove: (e: React.TouchEvent) => handleDragMove(e.touches[0].clientY),
    onTouchEnd: handleDragEnd,
    onMouseDown: (e: React.MouseEvent) => handleDragStart(e.clientY),
    onMouseMove: (e: React.MouseEvent) => handleDragMove(e.clientY),
    onMouseUp: handleDragEnd,
    onMouseLeave: () => {
      if (state.isDragging) {
        setState({ startY: null, deltaY: 0, isDragging: false });
      }
    },
  };

  return {
    deltaY: state.deltaY,
    isDragging: state.isDragging,
    isSwipeClosing,
    handlers,
    reset,
  };
}
