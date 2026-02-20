/**
 * Counselor Hooks Module
 *
 * 범용 상담 AI 훅 레이어
 * - 쿼리 훅: 대화 목록, 메시지 무한스크롤
 * - 뮤테이션 훅: 대화 생성, 목적 관리, 요약
 * - 비즈니스 로직 훅: 채팅 상태 통합 관리
 */

// Queries
export {
  useCounselorConversations,
  useActiveCounselorConversation,
  useCounselorConversation,
  useInfiniteCounselorMessages,
} from './queries';

// Mutations
export {
  useCreateCounselorConversation,
  useDeleteCounselorConversation,
  useSetActivePurpose,
  useClearActivePurpose,
  useTriggerSummarization,
} from './mutations';

// Business Logic
export { useCounselorChat } from './useCounselorChat';
export type { UseCounselorChatReturn } from './useCounselorChat';

// UI State Hooks (SRP)
export { useCounselorDrawer } from './useCounselorDrawer';
export { useRoutinePreview } from './useRoutinePreview';
