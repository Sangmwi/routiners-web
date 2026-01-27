/**
 * Coach Chat Reducer
 *
 * transient UI 상태만 관리 (메시지는 React Query 담당)
 * 원자적 상태 전이로 상태 불일치 방지
 */

import type { ChatMessage, ProfileConfirmationRequest } from '@/lib/types/chat';
import type { AIToolStatus, AIToolName, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
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

  /** 대기 중인 입력 요청 */
  pendingInput: InputRequest | null;
  /** 루틴 미리보기 */
  pendingRoutinePreview: RoutinePreviewData | null;
  /** 적용된 루틴 */
  appliedRoutine: RoutineAppliedEvent | null;
  /** 루틴 진행률 */
  routineProgress: RoutineProgressEvent | null;
  /** 대기 중인 프로필 확인 요청 */
  pendingProfileConfirmation: ProfileConfirmationRequest | null;
  /** 버퍼링된 프로필 확인 (스트리밍 중 layout shift 방지) */
  bufferedProfileConfirmation: ProfileConfirmationRequest | null;

  /** 요약 상태 */
  summarizationState: SummarizationState;
}

export const INITIAL_STATE: CoachChatState = {
  streamingContent: '',
  isStreaming: false,
  error: null,
  activeTools: [],
  pendingUserMessage: null,
  pendingInput: null,
  pendingRoutinePreview: null,
  appliedRoutine: null,
  routineProgress: null,
  pendingProfileConfirmation: null,
  bufferedProfileConfirmation: null,
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
  | { type: 'SET_PENDING_INPUT'; request: InputRequest }
  | { type: 'SET_ROUTINE_PREVIEW'; preview: RoutinePreviewData }
  | { type: 'SET_APPLIED_ROUTINE'; event: RoutineAppliedEvent }
  | { type: 'SET_ROUTINE_PROGRESS'; event: RoutineProgressEvent }
  | { type: 'BUFFER_PROFILE_CONFIRMATION'; request: ProfileConfirmationRequest }
  | { type: 'APPLY_BUFFERED_PROFILE_CONFIRMATION' }
  | { type: 'CLEAR_PROFILE_CONFIRMATION' }
  | { type: 'CLEAR_PENDING_INPUT' }

  // 요약
  | { type: 'SET_SUMMARIZATION'; state: SummarizationState }

  // 라이프사이클
  | { type: 'RESET_ALL' }
  | { type: 'RESTORE_PROFILE_CONFIRMATION'; request: ProfileConfirmationRequest }

  // 세션 메타데이터 복원 (페이지 재진입 시)
  | {
      type: 'RESTORE_SESSION_METADATA';
      pendingRoutinePreview: RoutinePreviewData | null;
      appliedRoutine: RoutineAppliedEvent | null;
      pendingProfileConfirmation: ProfileConfirmationRequest | null;
      pendingInput: InputRequest | null;
    };

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
        pendingInput: null, // 새 스트림 시작 → 이전 인풋 요청 클리어
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

    // ── 대기 상태 (원자적 전이) ──
    case 'SET_PENDING_INPUT':
      return { ...state, pendingInput: action.request };

    case 'CLEAR_PENDING_INPUT':
      return { ...state, pendingInput: null };

    case 'SET_ROUTINE_PREVIEW':
      return {
        ...state,
        pendingRoutinePreview: action.preview,
        routineProgress: null,    // 자동 클리어
        pendingInput: null,       // 자동 클리어
      };

    case 'SET_APPLIED_ROUTINE':
      return {
        ...state,
        appliedRoutine: action.event,
        pendingRoutinePreview: null,  // 자동 클리어
      };

    case 'SET_ROUTINE_PROGRESS':
      return { ...state, routineProgress: action.event };

    // ── 프로필 확인 ──
    case 'BUFFER_PROFILE_CONFIRMATION':
      return { ...state, bufferedProfileConfirmation: action.request };

    case 'APPLY_BUFFERED_PROFILE_CONFIRMATION':
      return {
        ...state,
        pendingProfileConfirmation: state.bufferedProfileConfirmation,
        bufferedProfileConfirmation: null,
      };

    case 'CLEAR_PROFILE_CONFIRMATION':
      return { ...state, pendingProfileConfirmation: null };

    case 'RESTORE_PROFILE_CONFIRMATION':
      return { ...state, pendingProfileConfirmation: action.request };

    // ── 요약 ──
    case 'SET_SUMMARIZATION':
      return { ...state, summarizationState: action.state };

    // ── 라이프사이클 ──
    case 'RESET_ALL':
      return INITIAL_STATE;

    // ── 세션 메타데이터 복원 (페이지 재진입 시 원자적 복원) ──
    case 'RESTORE_SESSION_METADATA':
      return {
        ...state,
        pendingRoutinePreview: action.pendingRoutinePreview,
        appliedRoutine: action.appliedRoutine,
        pendingProfileConfirmation: action.pendingProfileConfirmation,
        pendingInput: action.pendingInput,
      };

    default:
      return state;
  }
}
