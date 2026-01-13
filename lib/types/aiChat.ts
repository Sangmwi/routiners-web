/**
 * AI Chat Types
 *
 * 중앙 집중화된 AI Chat 타입 re-export
 * 외부 모듈에서 타입 참조 시 이 파일을 import
 */

// ChatState & ChatAction (Single Source of Truth: chatReducer.ts)
export type { ChatState, ChatAction } from '@/hooks/aiChat/helpers/chatReducer';

// Session metadata extraction types
export type { ExtractedSessionMetadata } from '@/hooks/aiChat/helpers/sessionMetadata';
