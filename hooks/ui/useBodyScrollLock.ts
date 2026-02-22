'use client';

import { useEffect, useRef } from 'react';

/**
 * Body 스크롤 잠금 훅
 * 모달/드로어 열릴 때 배경 스크롤 방지
 * Reference counting으로 중첩 모달 지원
 *
 * useRef로 이중 lock/unlock 방지 (StrictMode, HMR 안전)
 */
let lockCount = 0;

function lock() {
  lockCount++;
  if (lockCount === 1) {
    document.body.style.overflow = 'hidden';
  }
}

function unlock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = '';
  }
}

export function useBodyScrollLock(isLocked: boolean) {
  const lockedRef = useRef(false);

  useEffect(() => {
    if (isLocked && !lockedRef.current) {
      lockedRef.current = true;
      lock();
    } else if (!isLocked && lockedRef.current) {
      lockedRef.current = true; // will be set false below
      unlock();
      lockedRef.current = false;
    }

    return () => {
      if (lockedRef.current) {
        lockedRef.current = false;
        unlock();
      }
    };
  }, [isLocked]);
}
