/**
 * Server Data Sync Interface
 *
 * 서버 데이터 동기화 인터페이스 (DIP)
 * 구체적인 QueryClient 구현에서 분리하여 테스트 및 확장 가능
 */

/**
 * 서버 데이터 동기화 인터페이스
 *
 * 서버 데이터 캐시 무효화만 담당 (SRP)
 */
export interface ServerDataSync {
  /** 메시지 캐시 무효화 */
  invalidateMessages(conversationId: string): Promise<void>;

  /** 대화 캐시 무효화 */
  invalidateConversation(conversationId: string): Promise<void>;

  /** 메시지 및 대화 캐시 동시 무효화 */
  invalidateAll(conversationId: string): Promise<void>;
}
