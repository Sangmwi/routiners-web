'use client';

/**
 * Chat Cache Sync Hook
 *
 * AI 채팅 관련 React Query 캐시 동기화 유틸리티
 * queryClient.setQueryData 패턴을 통합하여 중복 제거
 */

import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import type { ChatMessage, AISessionCompat, ProfileConfirmationRequest } from '@/lib/types/chat';
import type { InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import type { MealPlanPreviewData } from '@/lib/types/meal';
import type { RoutineAppliedEvent, MealPlanAppliedEvent } from '@/lib/api/conversation';

type SessionPurpose = 'workout' | 'meal';

interface AISessionMetadataUpdate {
  pending_input?: InputRequest | null;
  pending_preview?: RoutinePreviewData | null;
  applied_routine?: RoutineAppliedEvent | null;
  pending_meal_preview?: MealPlanPreviewData | null;
  applied_meal_plan?: MealPlanAppliedEvent | null;
  pending_profile_confirmation?: ProfileConfirmationRequest | null;
}

/**
 * AI 채팅 캐시 동기화 훅
 *
 * @param purpose - 세션 목적 ('workout' | 'meal')
 *
 * @example
 * const cacheSync = useChatCacheSync('workout');
 * cacheSync.syncMessages(updatedMessages);
 * cacheSync.syncMetadata({ pending_input: request });
 */
export function useChatCacheSync(purpose: SessionPurpose) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.aiSession.active(purpose);

  // ==========================================================================
  // Core Sync Methods
  // ==========================================================================

  /** Active 세션 캐시의 메시지 업데이트 */
  const syncMessages = (messages: ChatMessage[]) => {
    queryClient.setQueryData(queryKey, (oldData: AISessionCompat | null | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, messages };
    });
  };

  /** Active 세션 캐시의 메타데이터 업데이트 (병합) */
  const syncMetadata = (updates: AISessionMetadataUpdate) => {
    queryClient.setQueryData(queryKey, (oldData: AISessionCompat | null | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, metadata: { ...oldData.metadata, ...updates } };
    });
  };

  /** 메시지 + 메타데이터 동시 업데이트 */
  const syncMessagesAndMetadata = (messages: ChatMessage[], metadataUpdates: AISessionMetadataUpdate) => {
    queryClient.setQueryData(queryKey, (oldData: AISessionCompat | null | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, messages, metadata: { ...oldData.metadata, ...metadataUpdates } };
    });
  };

  // ==========================================================================
  // Specific Sync Helpers (with auto-clear logic)
  // ==========================================================================

  /** Pending input 캐시 동기화 */
  const syncPendingInput = (request: InputRequest | null) =>
    syncMetadata({ pending_input: request ?? undefined });

  /** Routine preview 캐시 동기화 (pending_input 자동 정리) */
  const syncRoutinePreview = (preview: RoutinePreviewData | null) =>
    syncMetadata({ pending_preview: preview ?? undefined, pending_input: undefined });

  /** Applied routine 캐시 동기화 (pending_preview 자동 정리) */
  const syncRoutineApplied = (event: RoutineAppliedEvent) =>
    syncMetadata({ pending_preview: null, applied_routine: event });

  /** Meal plan preview 캐시 동기화 (pending_input 자동 정리) */
  const syncMealPlanPreview = (preview: MealPlanPreviewData | null) =>
    syncMetadata({ pending_meal_preview: preview ?? undefined, pending_input: undefined });

  /** Applied meal plan 캐시 동기화 (pending_meal_preview 자동 정리) */
  const syncMealPlanApplied = (event: MealPlanAppliedEvent) =>
    syncMetadata({ pending_meal_preview: null, applied_meal_plan: event });

  /** Profile confirmation 캐시 동기화 */
  const syncProfileConfirmation = (request: ProfileConfirmationRequest | null) =>
    syncMetadata({ pending_profile_confirmation: request ?? undefined });

  /** 사용자 응답 시 pending states 클리어 */
  const clearPendingStates = () =>
    syncMetadata({ pending_input: undefined, pending_profile_confirmation: undefined });

  // ==========================================================================
  // Invalidation Methods
  // ==========================================================================

  /** Detail 캐시 무효화 (active는 유지) */
  const invalidateDetail = (sessionId: string) =>
    queryClient.invalidateQueries({ queryKey: queryKeys.aiSession.detail(sessionId) });

  /** Active 세션 캐시 무효화 */
  const invalidateActive = () =>
    queryClient.invalidateQueries({ queryKey });

  /** 모든 세션 캐시 + 이벤트 캐시 무효화 */
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.aiSession.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.routineEvent.all });
  };

  /** 세션을 완료 상태로 마킹 (active + detail 캐시 모두 업데이트) */
  const markSessionCompleted = (sessionId: string) => {
    const completedData = {
      status: 'completed' as const,
      resultApplied: true,
      resultAppliedAt: new Date().toISOString(),
    };

    // 1. Active 캐시 업데이트
    queryClient.setQueryData(queryKey, (oldData: AISessionCompat | null | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, ...completedData };
    });

    // 2. Detail 캐시 업데이트 (동일한 세션이 캐시되어 있는 경우)
    const detailKey = queryKeys.aiSession.detail(sessionId);
    queryClient.setQueryData(detailKey, (oldData: AISessionCompat | null | undefined) => {
      if (!oldData) return oldData;
      return { ...oldData, ...completedData };
    });

    // 3. 이벤트 캐시 무효화 (새로 생성된 루틴/식단 이벤트 반영)
    queryClient.invalidateQueries({ queryKey: queryKeys.routineEvent.all });

    // 4. 세션 리스트 캐시 무효화 (히스토리 목록 업데이트)
    queryClient.invalidateQueries({ queryKey: queryKeys.aiSession.lists() });
  };

  return {
    // Core sync methods
    syncMessages,
    syncMetadata,
    syncMessagesAndMetadata,
    // Specific sync helpers
    syncPendingInput,
    syncRoutinePreview,
    syncRoutineApplied,
    syncMealPlanPreview,
    syncMealPlanApplied,
    syncProfileConfirmation,
    clearPendingStates,
    // Invalidation methods
    invalidateDetail,
    invalidateActive,
    invalidateAll,
    markSessionCompleted,
  };
}
