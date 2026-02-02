/**
 * AI Chat Handler Types
 *
 * Phase 21-E: SRP 준수 - Context/Result 타입만 정의
 * Zod 스키마는 schemas/ 디렉토리로 분리
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { RoutinePreviewData, InputRequest } from '@/lib/types/fitness';
import type { ProfileConfirmationRequest } from '@/lib/types/chat';
import type { ActivePurpose } from '@/lib/types/coach';

// =============================================================================
// Re-export Schemas (하위 호환성)
// =============================================================================
export {
  RequestUserInputArgsSchema,
  type RequestUserInputArgs,
  ConfirmProfileArgsSchema,
  type ConfirmProfileArgs,
  ApplyRoutineArgsSchema as ApplyPreviewArgsSchema,
  type ApplyRoutineArgs as ApplyPreviewArgs,
  SetActivePurposeArgsSchema,
  type SetActivePurposeArgs,
  GenerateRoutinePreviewArgsSchema,
  type GenerateRoutinePreviewArgs,
} from './schemas';

// =============================================================================
// Handler Context & Result Types
// =============================================================================

/**
 * Tool Handler Context
 * 모든 handler에 전달되는 공통 컨텍스트
 */
export interface ToolHandlerContext {
  userId: string;
  supabase: SupabaseClient;
  conversationId: string;
  sendEvent: (event: string, data: unknown) => void;
}

/**
 * Tool Handler Result
 * Handler 실행 결과
 */
export interface ToolHandlerResult {
  toolResult: string;
  continueLoop: boolean;
}

/**
 * Function Call 정보
 */
export interface FunctionCallInfo {
  id: string;
  callId: string;
  name: string;
  arguments: string;
}

// =============================================================================
// Conversation Metadata
// =============================================================================

/**
 * Conversation Metadata 타입
 */
export interface ConversationMetadata {
  /** 활성 목적 (구조화된 프로세스 진행 중일 때만) */
  activePurpose?: ActivePurpose | null;
  /** 대기 중인 루틴 미리보기 */
  pending_preview?: RoutinePreviewData;
  /** 대기 중인 프로필 확인 요청 */
  pending_profile_confirmation?: ProfileConfirmationRequest;
  /** 대기 중인 사용자 입력 요청 */
  pending_input?: InputRequest;
  /** 적용된 루틴 정보 */
  applied_routine?: {
    previewId: string;
    eventsCreated: number;
    startDate: string;
  };
  /** 메시지 카운트 (요약 트리거용) */
  messageCount?: number;
  [key: string]: unknown;
}
