'use client';

import { useSearchParams } from 'next/navigation';
import { CoachChatClient } from '@/components/coach';

/**
 * 코치 페이지 클라이언트 래퍼
 *
 * URL의 ?id= 파라미터를 클라이언트에서 직접 읽음
 */
export function CoachPageClient() {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get('id') ?? undefined;

  return <CoachChatClient initialConversationId={initialConversationId} />;
}
