/**
 * Error Toast Store (Zustand)
 *
 * 전역 에러 토스트 상태 관리
 * - 에러 메시지 표시/해제
 * - 자동 해제 타이머 지원
 * - 컴포넌트에서 showError() 호출만 하면 됨
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

interface ErrorState {
  /** 현재 표시 중인 에러 메시지 */
  message: string | null;
  /** 자동 해제 타이머 ID */
  timerId: ReturnType<typeof setTimeout> | null;
}

interface ErrorActions {
  /**
   * 에러 메시지 표시
   *
   * @param message - 표시할 에러 메시지
   * @param duration - 자동 해제 시간 (ms). 기본값 5000ms. 0이면 수동 해제만
   *
   * @example
   * showError('저장에 실패했습니다');
   * showError('네트워크 오류', 3000);
   */
  showError: (message: string, duration?: number) => void;

  /**
   * 에러 메시지 해제
   */
  clearError: () => void;
}

type ErrorStore = ErrorState & ErrorActions;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DURATION = 5000;

// ============================================================================
// Initial State
// ============================================================================

const initialState: ErrorState = {
  message: null,
  timerId: null,
};

// ============================================================================
// Store
// ============================================================================

export const useErrorStore = create<ErrorStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      showError: (message, duration = DEFAULT_DURATION) => {
        // 기존 타이머 정리
        const { timerId } = get();
        if (timerId) {
          clearTimeout(timerId);
        }

        // 새 타이머 설정 (duration > 0일 때만)
        const newTimerId =
          duration > 0
            ? setTimeout(() => {
                set({ message: null, timerId: null }, false, 'clearError/auto');
              }, duration)
            : null;

        set(
          { message, timerId: newTimerId },
          false,
          'showError'
        );
      },

      clearError: () => {
        const { timerId } = get();
        if (timerId) {
          clearTimeout(timerId);
        }
        set({ message: null, timerId: null }, false, 'clearError');
      },
    }),
    { name: 'ErrorStore' }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const selectErrorMessage = (state: ErrorStore) => state.message;
export const selectHasError = (state: ErrorStore) => state.message !== null;

// ============================================================================
// Hooks (Convenience)
// ============================================================================

/**
 * 에러 표시 헬퍼
 *
 * @example
 * const showError = useShowError();
 * showError('저장에 실패했습니다');
 */
export function useShowError() {
  return useErrorStore((state) => state.showError);
}

/**
 * 에러 상태 및 액션 전체
 *
 * @example
 * const { message, showError, clearError } = useError();
 */
export function useError() {
  return useErrorStore((state) => ({
    message: state.message,
    showError: state.showError,
    clearError: state.clearError,
  }));
}
