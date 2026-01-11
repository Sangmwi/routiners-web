'use client';

/**
 * Chat Cache Sync Hook
 *
 * AI 채팅 관련 React Query 캐시 동기화 유틸리티
 * queryClient.setQueryData 패턴을 통합하여 중복 제거
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
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

  /**
   * Active 세션 캐시의 메시지 업데이트
   */
  const syncMessages = useCallback(
    (messages: ChatMessage[]) => {
      queryClient.setQueryData(
        queryKeys.aiSession.active(purpose),
        (oldData: AISessionCompat | null | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, messages };
        }
      );
    },
    [queryClient, purpose]
  );

  /**
   * Active 세션 캐시의 메타데이터 업데이트 (병합)
   */
  const syncMetadata = useCallback(
    (updates: AISessionMetadataUpdate) => {
      queryClient.setQueryData(
        queryKeys.aiSession.active(purpose),
        (oldData: AISessionCompat | null | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            metadata: { ...oldData.metadata, ...updates },
          };
        }
      );
    },
    [queryClient, purpose]
  );

  /**
   * 메시지 + 메타데이터 동시 업데이트
   */
  const syncMessagesAndMetadata = useCallback(
    (messages: ChatMessage[], metadataUpdates: AISessionMetadataUpdate) => {
      queryClient.setQueryData(
        queryKeys.aiSession.active(purpose),
        (oldData: AISessionCompat | null | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            messages,
            metadata: { ...oldData.metadata, ...metadataUpdates },
          };
        }
      );
    },
    [queryClient, purpose]
  );

  /**
   * Pending input 캐시 동기화
   */
  const syncPendingInput = useCallback(
    (request: InputRequest | null) => {
      syncMetadata({ pending_input: request ?? undefined });
    },
    [syncMetadata]
  );

  /**
   * Routine preview 캐시 동기화 (pending_input 정리 포함)
   */
  const syncRoutinePreview = useCallback(
    (preview: RoutinePreviewData | null) => {
      syncMetadata({
        pending_preview: preview ?? undefined,
        pending_input: undefined,  // ✅ 이전 입력 요청 정리
      });
    },
    [syncMetadata]
  );

  /**
   * Applied routine 캐시 동기화 (pending_preview 제거 포함)
   */
  const syncRoutineApplied = useCallback(
    (event: RoutineAppliedEvent) => {
      syncMetadata({
        pending_preview: null,
        applied_routine: event,
      });
    },
    [syncMetadata]
  );

  /**
   * Meal plan preview 캐시 동기화 (pending_input 정리 포함)
   */
  const syncMealPlanPreview = useCallback(
    (preview: MealPlanPreviewData | null) => {
      syncMetadata({
        pending_meal_preview: preview ?? undefined,
        pending_input: undefined,  // ✅ 이전 입력 요청 정리
      });
    },
    [syncMetadata]
  );

  /**
   * Applied meal plan 캐시 동기화 (pending_meal_preview 제거 포함)
   */
  const syncMealPlanApplied = useCallback(
    (event: MealPlanAppliedEvent) => {
      syncMetadata({
        pending_meal_preview: null,
        applied_meal_plan: event,
      });
    },
    [syncMetadata]
  );

  /**
   * Profile confirmation 캐시 동기화
   */
  const syncProfileConfirmation = useCallback(
    (request: ProfileConfirmationRequest | null) => {
      syncMetadata({ pending_profile_confirmation: request ?? undefined });
    },
    [syncMetadata]
  );

  /**
   * 사용자 응답 시 pending states 클리어
   */
  const clearPendingStates = useCallback(() => {
    syncMetadata({
      pending_input: undefined,
      pending_profile_confirmation: undefined,
    });
  }, [syncMetadata]);

  /**
   * Detail 캐시 무효화 (active는 유지)
   */
  const invalidateDetail = useCallback(
    (sessionId: string) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiSession.detail(sessionId),
      });
    },
    [queryClient]
  );

  /**
   * Active 세션 캐시 무효화
   */
  const invalidateActive = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.aiSession.active(purpose),
    });
  }, [queryClient, purpose]);

  /**
   * 모든 세션 캐시 무효화
   */
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.aiSession.all,
    });
  }, [queryClient]);

  return useMemo(
    () => ({
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
    }),
    [
      syncMessages,
      syncMetadata,
      syncMessagesAndMetadata,
      syncPendingInput,
      syncRoutinePreview,
      syncRoutineApplied,
      syncMealPlanPreview,
      syncMealPlanApplied,
      syncProfileConfirmation,
      clearPendingStates,
      invalidateDetail,
      invalidateActive,
      invalidateAll,
    ]
  );
}
