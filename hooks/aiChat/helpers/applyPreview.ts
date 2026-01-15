/**
 * Apply Preview Helper
 *
 * 루틴/식단 미리보기 적용 공통 로직
 * P3: useReducer 기반 dispatch 사용
 */

import type { Dispatch } from 'react';
import type { useChatCacheSync } from '../useChatCacheSync';
import type { ChatAction } from './chatReducer';

// =============================================================================
// Types
// =============================================================================

type PreviewType = 'routine' | 'meal';

interface ApplyConfig {
  routine: {
    apiEndpoint: '/api/routine/apply';
    successAction: 'APPLY_ROUTINE_SUCCESS';
    errorMessage: '루틴 적용에 실패했습니다.';
    errorMessageGeneric: '루틴 적용 중 오류가 발생했습니다.';
  };
  meal: {
    apiEndpoint: '/api/meal/apply';
    successAction: 'APPLY_MEAL_SUCCESS';
    errorMessage: '식단 적용에 실패했습니다.';
    errorMessageGeneric: '식단 적용 중 오류가 발생했습니다.';
  };
}

const CONFIG: ApplyConfig = {
  routine: {
    apiEndpoint: '/api/routine/apply',
    successAction: 'APPLY_ROUTINE_SUCCESS',
    errorMessage: '루틴 적용에 실패했습니다.',
    errorMessageGeneric: '루틴 적용 중 오류가 발생했습니다.',
  },
  meal: {
    apiEndpoint: '/api/meal/apply',
    successAction: 'APPLY_MEAL_SUCCESS',
    errorMessage: '식단 적용에 실패했습니다.',
    errorMessageGeneric: '식단 적용 중 오류가 발생했습니다.',
  },
};

type CacheSync = ReturnType<typeof useChatCacheSync>;

// =============================================================================
// Main Function
// =============================================================================

/**
 * 미리보기 적용 공통 로직
 *
 * @param type - 'routine' | 'meal'
 * @param sessionId - 세션 ID
 * @param previewId - 미리보기 ID
 * @param dispatch - 상태 업데이터 (dispatch)
 * @param cacheSync - 캐시 동기화 유틸리티
 * @param forceOverwrite - 충돌 시 덮어쓰기 여부
 */
export async function applyPreview(
  type: PreviewType,
  sessionId: string,
  previewId: string,
  dispatch: Dispatch<ChatAction>,
  cacheSync: CacheSync,
  forceOverwrite = false
): Promise<void> {
  const config = CONFIG[type];

  dispatch({ type: 'START_APPLYING' });

  try {
    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: sessionId,
        previewId,
        forceOverwrite,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      dispatch({ type: 'APPLY_ERROR', error: result.error || config.errorMessage });
      return;
    }

    // 타입에 따른 상태 업데이트
    const appliedEvent = {
      previewId: result.data.previewId,
      eventsCreated: result.data.eventsCreated,
      startDate: result.data.startDate,
    };

    if (type === 'routine') {
      dispatch({ type: 'APPLY_ROUTINE_SUCCESS', event: appliedEvent });
    } else {
      dispatch({ type: 'APPLY_MEAL_SUCCESS', event: appliedEvent });
    }

    // 세션 완료 처리 (active + detail 캐시 모두 업데이트)
    cacheSync.markSessionCompleted(sessionId);
  } catch (error) {
    console.error(`[applyPreview:${type}] Error:`, error);
    dispatch({ type: 'APPLY_ERROR', error: config.errorMessageGeneric });
  }
}
