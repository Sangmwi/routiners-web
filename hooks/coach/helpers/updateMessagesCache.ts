/**
 * Coach Messages Cache Update Utility
 *
 * Phase 16: SSE 부분 업데이트용 캐시 조작 유틸리티
 * - SRP: 캐시 조작 로직만 담당
 * - 전체 refetch 없이 setQueryData로 부분 업데이트
 */

import type { InfiniteData } from '@tanstack/react-query';
import type { ChatMessage } from '@/lib/types/chat';
import type { CoachMessagePage } from '@/lib/types/coach';
import type { CompleteEventData } from '@/lib/api/conversation';

// =============================================================================
// Types
// =============================================================================

type MessagesCache = InfiniteData<CoachMessagePage> | undefined;

// =============================================================================
// Cache Update Functions
// =============================================================================

/**
 * SSE complete 이벤트 데이터로 캐시 부분 업데이트
 *
 * 1. optimistic 유저 메시지 제거
 * 2. 실제 유저 메시지 추가 (서버에서 저장된 것)
 * 3. AI 응답 메시지 추가
 *
 * @param old - 현재 캐시 데이터
 * @param completeData - SSE complete 이벤트 데이터
 * @returns 업데이트된 캐시 데이터
 */
export function updateCacheWithCompleteData(
  old: MessagesCache,
  completeData: CompleteEventData
): MessagesCache {
  if (!old?.pages?.length) return old;

  // 새로 추가할 메시지들
  const newMessages: ChatMessage[] = [];

  // 1. 유저 메시지 추가 (optimistic 대체)
  if (completeData.userMessage) {
    newMessages.push({
      id: completeData.userMessage.id,
      conversationId: '',
      role: 'user',
      content: completeData.userMessage.content,
      contentType: completeData.userMessage.contentType as ChatMessage['contentType'],
      createdAt: completeData.userMessage.createdAt,
    });
  }

  // 2. AI 메시지 추가
  if (completeData.aiMessages?.length) {
    for (const msg of completeData.aiMessages) {
      newMessages.push({
        id: msg.id,
        conversationId: '',
        role: 'assistant',
        content: msg.content,
        contentType: msg.contentType as ChatMessage['contentType'],
        createdAt: msg.createdAt,
      });
    }
  }

  // 캐시 업데이트
  const newPages = old.pages.map((page, pageIndex) => {
    if (pageIndex !== 0) return page;

    // 첫 번째 페이지에서:
    // 1. optimistic 메시지 제거 (실제 메시지로 대체됨)
    // 2. 실제 유저 메시지 + AI 응답 메시지 추가
    const filteredMessages = page.messages.filter(
      (m) => !m.id.startsWith('optimistic-')
    );

    return {
      ...page,
      messages: [...filteredMessages, ...newMessages],
    };
  });

  return { ...old, pages: newPages };
}

/**
 * 캐시에서 optimistic 메시지만 제거
 *
 * @param old - 현재 캐시 데이터
 * @returns 업데이트된 캐시 데이터
 */
export function removeOptimisticFromCache(old: MessagesCache): MessagesCache {
  if (!old?.pages?.length) return old;

  const newPages = old.pages.map((page) => ({
    ...page,
    messages: page.messages.filter((m) => !m.id.startsWith('optimistic-')),
  }));

  return { ...old, pages: newPages };
}
