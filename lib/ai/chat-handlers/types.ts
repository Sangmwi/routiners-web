/**
 * AI Chat Handler Types
 *
 * Tool handler 공통 타입 정의 및 입력 검증 스키마
 */

import { z } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import type { RoutinePreviewData, InputRequest } from '@/lib/types/fitness';
import type { ProfileConfirmationRequest } from '@/lib/types/chat';
import type { ActivePurpose } from '@/lib/types/coach';

// =============================================================================
// Tool Args Schemas (Zod 기반 런타임 검증)
// =============================================================================

/** request_user_input 도구 인자 스키마 */
export const RequestUserInputArgsSchema = z.object({
  message: z.string().optional(),
  type: z.enum(['radio', 'checkbox', 'slider']),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
  sliderConfig: z
    .object({
      min: z.number(),
      max: z.number(),
      step: z.number(),
      unit: z.string(),
      defaultValue: z.number().optional(),
    })
    .optional(),
});
export type RequestUserInputArgs = z.infer<typeof RequestUserInputArgsSchema>;

/** confirm_profile_data 도구 인자 스키마 */
export const ConfirmProfileArgsSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      value: z.string(),
      displayValue: z.string(),
    })
  ),
});
export type ConfirmProfileArgs = z.infer<typeof ConfirmProfileArgsSchema>;

/** apply_routine 도구 인자 스키마 */
export const ApplyPreviewArgsSchema = z.object({
  preview_id: z.string(),
});
export type ApplyPreviewArgs = z.infer<typeof ApplyPreviewArgsSchema>;

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
