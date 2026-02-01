/**
 * Server Data Sync Handler
 *
 * 서버 데이터 동기화 전용 핸들러 (SRP)
 * QueryClient를 인터페이스로 추상화하여 의존성 역전
 */

import type { QueryClient } from '@tanstack/react-query';
import type { ServerDataSync } from '../interfaces/serverDataSync';
import { queryKeys } from '@/lib/constants/queryKeys';

/**
 * QueryClient 기반 서버 데이터 동기화 구현
 *
 * 구체적인 QueryClient를 인터페이스로 래핑 (DIP)
 */
export class QueryClientServerDataSyncHandler implements ServerDataSync {
  constructor(private queryClient: QueryClient) {}

  async invalidateMessages(conversationId: string): Promise<void> {
    await this.queryClient.invalidateQueries({
      queryKey: queryKeys.coach.messages(conversationId),
    });
  }

  async invalidateConversation(conversationId: string): Promise<void> {
    await this.queryClient.invalidateQueries({
      queryKey: queryKeys.coach.conversation(conversationId),
    });
  }

  async invalidateAll(conversationId: string): Promise<void> {
    await Promise.all([
      this.invalidateMessages(conversationId),
      this.invalidateConversation(conversationId),
    ]);
  }
}
