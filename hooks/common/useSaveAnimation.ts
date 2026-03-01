'use client';

import { useState, useEffect, useRef } from 'react';
import { TIMING } from '@/lib/constants/timing';

/**
 * "저장 → 완료 애니메이션 → 자동 닫힘" 패턴을 추상화한 훅.
 *
 * isSaved=true 세트 후 delay ms 뒤 onClose 호출.
 * 컴포넌트 언마운트 시 타이머를 자동 정리.
 *
 * @example
 * const { isSaved, triggerSave } = useSaveAnimation(onClose);
 * mutation.mutate(data, { onSuccess: triggerSave });
 */
export function useSaveAnimation(onClose: () => void, delay = TIMING.UI.SAVE_ANIMATION) {
  const [isSaved, setIsSaved] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const triggerSave = () => {
    setIsSaved(true);
    closeTimerRef.current = setTimeout(onClose, delay);
  };

  const resetSaved = () => {
    setIsSaved(false);
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  return { isSaved, triggerSave, resetSaved };
}
