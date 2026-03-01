'use client';

import { useApplyRoutine } from './mutations';
import { usePreviewLifecycle } from './usePreviewLifecycle';
import { usePreviewUIState } from './usePreviewUIState';
import type { RoutinePreviewData } from '@/lib/types/fitness';

interface UseRoutinePreviewOptions {
  conversationId: string | null;
  sendMessage: (conversationId: string, content: string) => void;
  refetchMessages: () => Promise<unknown>;
}

interface RoutineApplyExtra {
  forceOverwrite?: boolean;
  weekCount?: number;
  appendMode?: boolean;
}

export function useRoutinePreview({
  conversationId,
  sendMessage,
  refetchMessages,
}: UseRoutinePreviewOptions) {
  const { isOpen, currentPreviewMessageId, open, close } = usePreviewUIState();
  const applyRoutine = useApplyRoutine();

  const {
    isApplying,
    apply: applyInternal,
    edit,
    cancel,
  } = usePreviewLifecycle<RoutinePreviewData, RoutineApplyExtra>({
    conversationId,
    sendMessage,
    refetchMessages,
    executeApply: ({ conversationId, previewId, extra }) =>
      applyRoutine.mutateAsync({
        conversationId,
        previewId,
        forceOverwrite: extra?.forceOverwrite,
        weekCount: extra?.weekCount,
        appendMode: extra?.appendMode,
      }),
    editMessage: '루틴을 수정하고 싶어요.',
    cancelMessage: '루틴 생성을 취소했어요.',
    logPrefix: '[Routine Preview]',
    onAfterSuccess: close,
  });

  const apply = (
    messageId: string,
    previewData: RoutinePreviewData,
    forceOverwrite?: boolean,
    weekCount?: number,
    appendMode?: boolean,
  ) =>
    applyInternal(messageId, previewData, {
      forceOverwrite,
      weekCount,
      appendMode,
    });

  return {
    isOpen,
    currentPreviewMessageId,
    isApplying,
    open,
    close,
    apply,
    edit,
    cancel,
  };
}

