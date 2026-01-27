/**
 * Apply Preview Helper
 *
 * 루틴 미리보기 적용 로직
 * P3: useReducer 기반 dispatch 사용
 */

import type { Dispatch } from 'react';
import type { useChatCacheSync } from '../useChatCacheSync';
import type { ChatAction } from './chatReducer';

// =============================================================================
// Types
// =============================================================================

interface ApplyConfig {
  apiEndpoint: string;
  errorMessage: string;
  errorMessageGeneric: string;
}

const CONFIG: ApplyConfig = {
  apiEndpoint: '/api/routine/apply',
  errorMessage: '루틴 적용에 실패했습니다.',
  errorMessageGeneric: '루틴 적용 중 오류가 발생했습니다.',
};

type CacheSync = ReturnType<typeof useChatCacheSync>;

// =============================================================================
// Main Function
// =============================================================================

/**
 * 루틴 미리보기 적용 로직
 *
 * @param _type - 'routine' (legacy parameter, kept for compatibility)
 * @param sessionId - 세션 ID
 * @param previewId - 미리보기 ID
 * @param dispatch - 상태 업데이터 (dispatch)
 * @param cacheSync - 캐시 동기화 유틸리티
 * @param forceOverwrite - 충돌 시 덮어쓰기 여부
 */
export async function applyPreview(
  _type: 'routine',
  sessionId: string,
  previewId: string,
  dispatch: Dispatch<ChatAction>,
  cacheSync: CacheSync,
  forceOverwrite = false
): Promise<void> {
  dispatch({ type: 'START_APPLYING' });

  try {
    const response = await fetch(CONFIG.apiEndpoint, {
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
      dispatch({ type: 'APPLY_ERROR', error: result.error || CONFIG.errorMessage });
      return;
    }

    const appliedEvent = {
      previewId: result.data.previewId,
      eventsCreated: result.data.eventsCreated,
      startDate: result.data.startDate,
    };

    dispatch({ type: 'APPLY_ROUTINE_SUCCESS', event: appliedEvent });

    // 세션 완료 처리 (active + detail 캐시 모두 업데이트)
    cacheSync.markSessionCompleted(sessionId);
  } catch (error) {
    console.error('[applyPreview:routine] Error:', error);
    dispatch({ type: 'APPLY_ERROR', error: CONFIG.errorMessageGeneric });
  }
}
