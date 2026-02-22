'use client';

import { useState } from 'react';
import { useClearActivePurpose } from './mutations';
import { useMessageStatusUpdate } from './useMessageStatusUpdate';

interface PreviewWithId {
  id?: string | null;
}

interface UsePreviewLifecycleOptions<TPreview extends PreviewWithId, TApplyExtra> {
  conversationId: string | null;
  sendMessage: (conversationId: string, content: string) => void;
  refetchMessages: () => Promise<unknown>;
  executeApply: (params: {
    conversationId: string;
    previewId: string;
    previewData: TPreview;
    extra?: TApplyExtra;
  }) => Promise<unknown>;
  editMessage: string;
  cancelMessage: string;
  logPrefix: string;
  onAfterSuccess?: () => void;
}

export function usePreviewLifecycle<TPreview extends PreviewWithId, TApplyExtra = void>({
  conversationId,
  sendMessage,
  refetchMessages,
  executeApply,
  editMessage,
  cancelMessage,
  logPrefix,
  onAfterSuccess,
}: UsePreviewLifecycleOptions<TPreview, TApplyExtra>) {
  const [isApplying, setIsApplying] = useState(false);
  const clearActivePurpose = useClearActivePurpose();

  const { updateStatus } = useMessageStatusUpdate({
    conversationId,
    onError: refetchMessages,
  });

  const apply = async (
    messageId: string,
    previewData: TPreview,
    extra?: TApplyExtra,
  ) => {
    const previewId = previewData?.id;
    if (!conversationId || !previewId) return;

    setIsApplying(true);
    try {
      await executeApply({
        conversationId,
        previewId,
        previewData,
        extra,
      });

      await updateStatus(messageId, 'applied');
      onAfterSuccess?.();
    } catch (error) {
      console.error(`${logPrefix} Failed to apply:`, error);
    } finally {
      setIsApplying(false);
    }
  };

  const edit = async (messageId: string) => {
    if (!conversationId) return;

    try {
      await updateStatus(messageId, 'edited');
      sendMessage(conversationId, editMessage);
      onAfterSuccess?.();
    } catch (error) {
      console.error(`${logPrefix} Failed to edit:`, error);
    }
  };

  const cancel = async (messageId: string) => {
    if (!conversationId) return;

    try {
      await updateStatus(messageId, 'cancelled');
      await clearActivePurpose.mutateAsync(conversationId);
      sendMessage(conversationId, cancelMessage);
      onAfterSuccess?.();
    } catch (error) {
      console.error(`${logPrefix} Failed to cancel:`, error);
    }
  };

  return {
    isApplying,
    apply,
    edit,
    cancel,
  };
}

