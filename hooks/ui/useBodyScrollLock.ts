'use client';

import { useEffect } from 'react';

/**
 * Body 스크롤 잠금 훅
 * 모달/드로어 열릴 때 배경 스크롤 방지
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isLocked]);
}
