'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
 * Shared modal visibility/animation state.
 * Handles open/close transitions and external close requests.
 *
 * onClose는 ref로 안정화하여 effect 재실행을 방지합니다.
 */
export function useModalState(
  isOpen: boolean,
  onClose: () => void,
): UseModalStateReturn {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);

  // onClose를 ref로 안정화 — effect 재실행 방지
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const executeClose = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setIsVisible(false);
      setHasOpened(false);
      onCloseRef.current();
    }, ANIMATION_DURATION);
  }, [isAnimating]);

  useEffect(() => {
    if (isOpen && !isVisible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
      setIsAnimating(false);
      setHasOpened(false);
      const timer = setTimeout(() => setHasOpened(true), OPEN_ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }

    if (!isOpen && isVisible && !isAnimating) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setIsVisible(false);
        setHasOpened(false);
        onCloseRef.current();
      }, ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, isOpen, isVisible]);

  return {
    isVisible,
    isAnimating,
    hasOpened,
    executeClose,
  };
}
