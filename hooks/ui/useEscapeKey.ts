'use client';

import { useDocumentEventListener } from '@/hooks/common/useEventListener';

/**
 * ESC 키 감지 훅
 */
export function useEscapeKey(enabled: boolean, onEscape: () => void) {
  useDocumentEventListener('keydown', (e) => {
    if (!enabled) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      onEscape();
    }
  });
}
