/**
 * Coach Chat Reducer
 *
 * transient UI 상태만 관리 (메시지는 React Query 담당)
 * 원자적 상태 전이로 상태 불일치 방지
 */

import type { ChatMessage } from '@/lib/types/chat';
import type { AIToolStatus, AIToolName } from '@/lib/types/fitness';
import type { RoutineAppliedEvent, RoutineProgressEvent } from '@/lib/api/conversation';
import type { SummarizationState } from '@/lib/types/coach';

// =============================================================================
// State
// =============================================================================

export interface CoachChatState {
  /** 스트리밍 콘텐츠 */
  streamingContent: string;
  /** 스트리밍 중 여부 */
  isStreaming: boolean;
  /** 에러 메시지 */
  error: string | null;

  /** 활성 도구 상태 */
  activeTools: AIToolStatus[];

  /** 낙관적 사용자 메시지 (전송 즉시 표시, refetch 후 제거) */
  pendingUserMessage: ChatMessage | null;

  /** 적용된 루틴 */
  appliedRoutine: RoutineAppliedEvent | null;
  /** 루틴 진행률 */
  routineProgress: RoutineProgressEvent | null;

  /** 요약 상태 */
  summarizationState: SummarizationState;
}

export const INITIAL_STATE: CoachChatState = {
  streamingContent: '',
  isStreaming: false,
  error: null,
  activeTools: [],
  pendingUserMessage: null,
  appliedRoutine: null,
  routineProgress: null,
  summarizationState: { isSummarizing: false },
};

// =============================================================================
// Actions
// =============================================================================

export type CoachChatAction =
  // 스트리밍 라이프사이클
  | { type: 'START_STREAMING'; pendingMessage: ChatMessage }
  | { type: 'APPEND_STREAMING'; chunk: string }
  | { type: 'COMPLETE_STREAMING' }
  | { type: 'CLEAR_STREAMING_CONTENT' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CANCEL_STREAM' }

  // 낙관적 메시지
  | { type: 'CLEAR_PENDING_USER_MESSAGE' }

  // 도구
  | { type: 'TOOL_START'; toolCallId: string; name: AIToolName }
  | { type: 'TOOL_DONE'; toolCallId: string; success: boolean }
  | { type: 'RESET_TOOLS' }

  // 대기 상태
  | { type: 'SET_APPLIED_ROUTINE'; event: RoutineAppliedEvent }
  | { type: 'SET_ROUTINE_PROGRESS'; event: RoutineProgressEvent }

  // 요약
  | { type: 'SET_SUMMARIZATION'; state: SummarizationState }

  // 라이프사이클
  | { type: 'RESET_ALL' };

// =============================================================================
// Reducer
// =============================================================================

export function coachReducer(state: CoachChatState, action: CoachChatAction): CoachChatState {
  switch (action.type) {
    // ── 스트리밍 라이프사이클 ──
    case 'START_STREAMING':
      return {
        ...state,
        streamingContent: '',
        isStreaming: true,
        error: null,
        activeTools: [],
        pendingUserMessage: action.pendingMessage,
      };

    case 'APPEND_STREAMING':
      return {
        ...state,
        streamingContent: state.streamingContent + action.chunk,
      };

    case 'COMPLETE_STREAMING':
      return {
        ...state,
        // streamingContent 유지 — invalidateQueries 완료 후 CLEAR_STREAMING_CONTENT로 제거
        isStreaming: false,
        // pendingUserMessage는 유지 — 메시지 refetch 완료 후 별도 클리어
      };

    case 'CLEAR_STREAMING_CONTENT':
      return { ...state, streamingContent: '' };

    case 'SET_ERROR':
      return {
        ...state,
        streamingContent: '',
        isStreaming: false,
        pendingUserMessage: null,
        error: action.error,
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'CANCEL_STREAM':
      return {
        ...state,
        streamingContent: '',
        isStreaming: false,
        pendingUserMessage: null,
      };

    // ── 낙관적 메시지 ──
    case 'CLEAR_PENDING_USER_MESSAGE':
      return { ...state, pendingUserMessage: null };

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
