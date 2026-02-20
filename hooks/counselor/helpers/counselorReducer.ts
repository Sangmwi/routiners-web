/**
 * Counselor Chat Reducer
 *
 * transient UI 상태만 관리 (메시지는 React Query 담당)
 * 원자적 상태 전이로 상태 불일치 방지
 *
 * Phase 13: pendingUserMessage 제거
 * - 낙관적 메시지는 React Query 캐시에서 관리
 * - useSendCounselorMessage의 onMutate 패턴 사용
 */

import type { AIToolStatus, AIToolName } from '@/lib/types/fitness';
import type { RoutineAppliedEvent, RoutineProgressEvent } from '@/lib/api/conversation';
import type { SummarizationState } from '@/lib/types/counselor';

// =============================================================================
// State
// =============================================================================

export interface CounselorChatState {
  /** 스트리밍 콘텐츠 */
  streamingContent: string;
  /** 스트리밍 중 여부 */
  isStreaming: boolean;
  /** 에러 메시지 */
  error: string | null;

  /** 활성 도구 상태 */
  activeTools: AIToolStatus[];

  /** 적용된 루틴 */
  appliedRoutine: RoutineAppliedEvent | null;
  /** 루틴 진행률 */
  routineProgress: RoutineProgressEvent | null;

  /** 요약 상태 */
  summarizationState: SummarizationState;
}

export const INITIAL_STATE: CounselorChatState = {
  streamingContent: '',
  isStreaming: false,
  error: null,
  activeTools: [],
  appliedRoutine: null,
  routineProgress: null,
  summarizationState: { isSummarizing: false },
};

// =============================================================================
// Actions
// =============================================================================

export type CounselorChatAction =
  // 스트리밍 라이프사이클
  | { type: 'START_STREAMING' }
  | { type: 'APPEND_STREAMING'; chunk: string }
  | { type: 'COMPLETE_STREAMING' }
  | { type: 'CLEAR_STREAMING_CONTENT' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CANCEL_STREAM' }

  // 도구
  | { type: 'TOOL_START'; toolCallId: string; name: AIToolName }
  | { type: 'TOOL_DONE'; toolCallId: string; success: boolean }
  | { type: 'RESET_TOOLS' }

  // 대기 상태
  | { type: 'SET_APPLIED_ROUTINE'; event: RoutineAppliedEvent }
  | { type: 'SET_ROUTINE_PROGRESS'; event: RoutineProgressEvent }
  | { type: 'CLEAR_ROUTINE_PROGRESS' }

  // 요약
  | { type: 'SET_SUMMARIZATION'; state: SummarizationState }

  // 라이프사이클
  | { type: 'RESET_ALL' };

// =============================================================================
// Reducer
// =============================================================================

export function counselorReducer(state: CounselorChatState, action: CounselorChatAction): CounselorChatState {
  switch (action.type) {
    // ── 스트리밍 라이프사이클 ──
    case 'START_STREAMING':
      return {
        ...state,
        streamingContent: '',
        isStreaming: true,
        error: null,
        activeTools: [],
      };

    case 'APPEND_STREAMING':
      return {
        ...state,
        streamingContent: state.streamingContent + action.chunk,
      };

    case 'COMPLETE_STREAMING':
      return {
        ...state,
        // streamingContent 유지 — refetch 완료 후 CLEAR_STREAMING_CONTENT로 제거
        isStreaming: false,
      };

    case 'CLEAR_STREAMING_CONTENT':
      return { ...state, streamingContent: '' };

    case 'SET_ERROR':
      return {
        ...state,
        streamingContent: '',
        isStreaming: false,
        error: action.error,
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'CANCEL_STREAM':
      return {
        ...state,
        streamingContent: '',
        isStreaming: false,
      };

    // ── 도구 ──
    case 'TOOL_START':
      return {
        ...state,
        activeTools: [
          ...state.activeTools,
          { toolCallId: action.toolCallId, name: action.name, status: 'running' },
        ],
      };

    case 'TOOL_DONE':
      return {
        ...state,
        activeTools: state.activeTools.map((t) =>
          t.toolCallId === action.toolCallId
            ? { ...t, status: action.success ? 'completed' : 'error' }
            : t
        ),
      };

    case 'RESET_TOOLS':
      return { ...state, activeTools: [] };

    // ── 대기 상태 ──
    case 'SET_APPLIED_ROUTINE':
      return {
        ...state,
        appliedRoutine: action.event,
      };

    case 'SET_ROUTINE_PROGRESS':
      return { ...state, routineProgress: action.event };

    case 'CLEAR_ROUTINE_PROGRESS':
      return { ...state, routineProgress: null };

    // ── 요약 ──
    case 'SET_SUMMARIZATION':
      return { ...state, summarizationState: action.state };

    // ── 라이프사이클 ──
    case 'RESET_ALL':
      return INITIAL_STATE;

    default:
      return state;
  }
}
