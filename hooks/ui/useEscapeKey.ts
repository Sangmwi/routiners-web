'use client';

import { useEffect } from 'react';

/**
 * ESC 키 감지 훅
 */
export function useEscapeKey(enabled: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!enabled) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // 중첩 모달에서 가장 위 모달만 닫히도록
        onEscape();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [enabled, onEscape]);
}
