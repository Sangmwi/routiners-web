'use client';

import { useState } from 'react';

/**
 * 프리뷰 드로어의 open/close + 현재 메시지 ID 상태를 관리하는 훅.
 * useRoutinePreview / useMealPreview 의 공통 UI 상태를 추출.
 */
export function usePreviewUIState() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPreviewMessageId, setCurrentPreviewMessageId] = useState<string | null>(null);

  const open = (messageId?: string) => {
    if (messageId) setCurrentPreviewMessageId(messageId);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setCurrentPreviewMessageId(null);
  };

  return { isOpen, currentPreviewMessageId, open, close };
}
