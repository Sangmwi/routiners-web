'use client';

import { useEffect } from 'react';

/**
 * Body 스크롤 잠금 훅
 * 모달/드로어 열릴 때 배경 스크롤 방지
 * Reference counting으로 중첩 모달 지원
 */
let lockCount = 0;

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      lockCount++;
      if (lockCount === 1) {
        document.body.style.overflow = 'hidden';
      }
      return () => {
        lockCount--;
        if (lockCount === 0) {
          document.body.style.overflow = '';
        }
      };
    }
  }, [isLocked]);
}
