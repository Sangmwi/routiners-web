'use client';

import { useEffect, useRef, useState } from 'react';

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
  /** 드래그 등 상호작용 시 오픈 애니메이션 재실행 방지 */
  markOpened: () => void;
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

  // 닫기 진행 중 여부를 ref로 추적 — effect/callback 양쪽에서 중복 닫기 방지
  const isClosingRef = useRef(false);

  const executeClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setIsVisible(false);
      setHasOpened(false);
      isClosingRef.current = false;
      onCloseRef.current();
    }, ANIMATION_DURATION);
  };

  // isOpen 변화에 반응 — isAnimating은 deps에서 제외하여
  // setIsAnimating이 effect cleanup을 trigger하지 않도록 함
  useEffect(() => {
    if (isOpen && !isVisible) {
      isClosingRef.current = false;
      setIsVisible(true);
      setIsAnimating(false);
      setHasOpened(false);
      const timer = setTimeout(() => setHasOpened(true), OPEN_ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }

    if (!isOpen && isVisible && !isClosingRef.current) {
      isClosingRef.current = true;
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setIsVisible(false);
        setHasOpened(false);
        isClosingRef.current = false;
        onCloseRef.current();
      }, ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  /** 드래그 등 상호작용 시 오픈 애니메이션 재실행 방지용 */
  const markOpened = () => setHasOpened(true);

  return {
    isVisible,
    isAnimating,
    hasOpened,
    markOpened,
    executeClose,
  };
}
