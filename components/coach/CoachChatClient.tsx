'use client';

import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import CoachChatContent from './CoachChatContent';

interface CoachChatClientProps {
  initialConversationId?: string;
}

/**
 * 코치 채팅 클라이언트 래퍼
 *
 * - 'use client' 선언
 * - 에러 바운더리 적용
 */
export function CoachChatClient({ initialConversationId }: CoachChatClientProps) {
  return (
    <QueryErrorBoundary>
      <CoachChatContent initialConversationId={initialConversationId} />
    </QueryErrorBoundary>
  );
}
