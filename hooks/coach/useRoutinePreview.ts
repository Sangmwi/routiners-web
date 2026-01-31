'use client';

import { useState } from 'react';
import { useApplyRoutine } from './mutations';
import type { RoutinePreviewData } from '@/lib/types/fitness';

interface UseRoutinePreviewOptions {
  /** 현재 대화 ID */
  conversationId: string | null;
  /** 대기 중인 루틴 프리뷰 */
  pendingRoutinePreview: RoutinePreviewData | null;
}

/**
 * 루틴 프리뷰 드로어 관리 훅 (SRP)
 *
 * 책임:
 * - 프리뷰 드로어 열림/닫힘 상태
 * - 루틴 적용 처리 (isApplying 상태 포함)
 */
export function useRoutinePreview({
  conversationId,
  pendingRoutinePreview,
}: UseRoutinePreviewOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const applyRoutine = useApplyRoutine();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const apply = async (forceOverwrite?: boolean) => {
    if (!conversationId || !pendingRoutinePreview?.id) return;

    setIsApplying(true);
    try {
      await applyRoutine.mutateAsync({
        conversationId,
        previewId: pendingRoutinePreview.id,
        forceOverwrite,
      });
      close();
    } finally {
      setIsApplying(false);
    }
  };

  return {
    isOpen,
    isApplying,
    open,
    close,
    apply,
  };
}
