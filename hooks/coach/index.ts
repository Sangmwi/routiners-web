/**
 * Coach Hooks Module
 *
 * 범용 코치 AI 훅 레이어
 * - 쿼리 훅: 대화 목록, 메시지 무한스크롤
 * - 뮤테이션 훅: 대화 생성, 목적 관리, 요약
 * - 비즈니스 로직 훅: 채팅 상태 통합 관리
 */

// Queries
export {
  useCoachConversations,
  useActiveCoachConversation,
  useCoachConversation,
  useInfiniteCoachMessages,
} from './queries';

// Mutations
export {
  useCreateCoachConversation,
  useDeleteCoachConversation,
  useSetActivePurpose,
  useClearActivePurpose,
  useTriggerSummarization,
} from './mutations';

// Business Logic
export { useCoachChat } from './useCoachChat';
export type { UseCoachChatReturn } from './useCoachChat';

// UI State Hooks (SRP)
export { useCoachDrawer } from './useCoachDrawer';
export { useRoutinePreview } from './useRoutinePreview';
