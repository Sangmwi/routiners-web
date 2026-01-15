'use client';

import { useState, useCallback, useEffect } from 'react';

// ============================================================================
// Constants
// ============================================================================

const ANIMATION_DURATION = 200;
const OPEN_ANIMATION_DURATION = 300;

// ============================================================================
// Types
// ============================================================================

interface UseModalStateReturn {
  isVisible: boolean;
  isAnimating: boolean;
  hasOpened: boolean;
  executeClose: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * 모달 상태 관리 훅
 * 열기/닫기 애니메이션 및 상태 동기화 처리
 */
export function useModalState(
  isOpen: boolean,
  onClose: () => void
): UseModalStateReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  const executeClose = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setIsVisible(false);
      setHasOpened(false);
      onClose();
    }, ANIMATION_DURATION);
  }, [isAnimating, onClose]);

  useEffect(() => {
    if (isOpen && !isVisible) {
      // 열기
      setIsVisible(true);
      setIsAnimating(false);
      setHasOpened(false);
      const timer = setTimeout(() => setHasOpened(true), OPEN_ANIMATION_DURATION);
      return () => clearTimeout(timer);
    } else if (!isOpen && isVisible && !isAnimating) {
      // 외부에서 닫기
      executeClose();
    }
  }, [isOpen, isVisible, isAnimating, executeClose]);

  return {
    isVisible,
    isAnimating,
    hasOpened,
    executeClose,
  };
}
