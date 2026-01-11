/**
 * AI Chat Handler Types
 *
 * Tool handler 공통 타입 정의
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { RoutinePreviewData, InputRequest } from '@/lib/types/fitness';
import type { MealPlanPreviewData } from '@/lib/types/meal';
import type { ProfileConfirmationRequest } from '@/lib/types/chat';

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
  pending_preview?: RoutinePreviewData;
  pending_meal_preview?: MealPlanPreviewData;
  pending_profile_confirmation?: ProfileConfirmationRequest;
  pending_input?: InputRequest;
  applied_routine?: {
    previewId: string;
    eventsCreated: number;
    startDate: string;
  };
  applied_meal_plan?: {
    previewId: string;
    eventsCreated: number;
    startDate: string;
  };
  [key: string]: unknown;
}
