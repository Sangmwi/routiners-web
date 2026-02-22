'use client';

import { useApplyMealPlan } from './mutations';
import { usePreviewLifecycle } from './usePreviewLifecycle';
import type { MealPlanPreviewData } from '@/lib/types/meal';

interface UseMealPreviewOptions {
  conversationId: string | null;
  sendMessage: (conversationId: string, content: string) => void;
  refetchMessages: () => Promise<unknown>;
}

export function useMealPreview({
  conversationId,
  sendMessage,
  refetchMessages,
}: UseMealPreviewOptions) {
  const applyMealPlan = useApplyMealPlan();

  const {
    isApplying,
    apply: applyInternal,
    edit,
    cancel,
  } = usePreviewLifecycle<MealPlanPreviewData>({
    conversationId,
    sendMessage,
    refetchMessages,
    executeApply: ({ conversationId, previewId }) =>
      applyMealPlan.mutateAsync({
        conversationId,
        previewId,
      }),
    editMessage: '식단을 수정하고 싶어요.',
    cancelMessage: '식단 생성을 취소했어요.',
    logPrefix: '[Meal Preview]',
  });

  const apply = (messageId: string, previewData: MealPlanPreviewData) =>
    applyInternal(messageId, previewData);

  return {
    isApplying,
    apply,
    edit,
    cancel,
  };
}

