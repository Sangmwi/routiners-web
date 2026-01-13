/**
 * Chat Reducer
 *
 * ChatState 상태 관리의 단일 소유권 (Single Source of Truth)
 * - ChatState 인터페이스 정의
 * - INITIAL_STATE 상수
 * - Action 타입 및 reducer 함수
 */

import type { ChatMessage, AISessionCompat, ProfileConfirmationRequest } from '@/lib/types/chat';
import type {
  RoutineAppliedEvent,
  MealPlanAppliedEvent,
  RoutineProgressEvent,
  MealPlanProgressEvent,
  ToolEvent,
} from '@/lib/api/conversation';
import type { AIToolName, AIToolStatus, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import type { MealPlanPreviewData } from '@/lib/types/meal';
import type { SessionPurpose } from '@/lib/types/routine';

// =============================================================================
// ChatState (Single Source of Truth)
// =============================================================================

export interface ChatState {
  messages: ChatMessage[];
  streamingContent: string;
  isSending: boolean;
  error: string | null;
  activeTools: AIToolStatus[];
  pendingInput: InputRequest | null;
  pendingRoutinePreview: RoutinePreviewData | null;
  appliedRoutine: RoutineAppliedEvent | null;
  routineProgress: RoutineProgressEvent | null;
  pendingMealPreview: MealPlanPreviewData | null;
  appliedMealPlan: MealPlanAppliedEvent | null;
  mealProgress: MealPlanProgressEvent | null;
  pendingProfileConfirmation: ProfileConfirmationRequest | null;
  pendingStart: boolean;
}

export const INITIAL_STATE: ChatState = {
  messages: [],
  streamingContent: '',
  isSending: false,
  error: null,
  activeTools: [],
  pendingInput: null,
  pendingRoutinePreview: null,
  appliedRoutine: null,
  routineProgress: null,
  pendingMealPreview: null,
  appliedMealPlan: null,
  mealProgress: null,
  pendingProfileConfirmation: null,
  pendingStart: false,
};

// Lazy import to avoid circular dependency (builders use INITIAL_STATE)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const getBuilders = () => require('./sessionStateBuilder') as typeof import('./sessionStateBuilder');

// =============================================================================
// Action Types
// =============================================================================

export type ChatAction =
  // Session lifecycle
  | { type: 'RESET' }
  | { type: 'RESTORE_SESSION'; session: AISessionCompat; messages: ChatMessage[] }
  | { type: 'NEW_SESSION'; sessionId: string; purpose: SessionPurpose }
  | { type: 'MERGE_SESSION'; session: AISessionCompat; messages: ChatMessage[] }
  // Sending messages
  | { type: 'START_SENDING'; messages: ChatMessage[]; keepPendingInput?: boolean }
  | { type: 'APPEND_STREAMING'; chunk: string }
  | { type: 'COMPLETE_SENDING'; message: ChatMessage | null }
  | { type: 'CANCEL_STREAM' }
  | { type: 'SET_ERROR'; error: string; rollbackLastMessage?: boolean }
  | { type: 'CLEAR_ERROR' }
  // Tool status
  | { type: 'TOOL_START'; event: ToolEvent }
  | { type: 'TOOL_DONE'; event: ToolEvent }
  | { type: 'CLEANUP_TOOLS'; status: AIToolStatus['status'] }
  // Pending states
  | { type: 'SET_PENDING_INPUT'; input: InputRequest | null }
  | { type: 'SET_PENDING_START'; pending: boolean }
  | { type: 'SUBMIT_INPUT'; messages: ChatMessage[] }
  // Routine
  | { type: 'SET_ROUTINE_PREVIEW'; preview: RoutinePreviewData | null }
  | { type: 'SET_APPLIED_ROUTINE'; event: RoutineAppliedEvent }
  | { type: 'SET_ROUTINE_PROGRESS'; progress: RoutineProgressEvent | null }
  | { type: 'CLEAR_ROUTINE_PREVIEW' }
  // Meal
  | { type: 'SET_MEAL_PREVIEW'; preview: MealPlanPreviewData | null }
  | { type: 'SET_APPLIED_MEAL'; event: MealPlanAppliedEvent }
  | { type: 'SET_MEAL_PROGRESS'; progress: MealPlanProgressEvent | null }
  | { type: 'CLEAR_MEAL_PREVIEW' }
  // Profile confirmation
  | { type: 'SET_PROFILE_CONFIRMATION'; confirmation: ProfileConfirmationRequest | null }
  | { type: 'CLEAR_PROFILE_CONFIRMATION' }
  // Apply preview (routine/meal)
  | { type: 'START_APPLYING' }
  | { type: 'APPLY_ROUTINE_SUCCESS'; event: RoutineAppliedEvent }
  | { type: 'APPLY_MEAL_SUCCESS'; event: MealPlanAppliedEvent }
  | { type: 'APPLY_ERROR'; error: string };

// =============================================================================
// Reducer
// =============================================================================

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    // -------------------------------------------------------------------------
    // Session lifecycle
    // -------------------------------------------------------------------------
    case 'RESET':
      return INITIAL_STATE;

    case 'RESTORE_SESSION': {
      const { buildRestoredState } = getBuilders();
      return buildRestoredState(action.session, action.messages);
    }

    case 'NEW_SESSION': {
      const { buildNewSessionState } = getBuilders();
      return buildNewSessionState(action.sessionId, action.purpose);
    }

    case 'MERGE_SESSION': {
      const { mergeSessionUpdate } = getBuilders();
      return mergeSessionUpdate(state, action.session, action.messages);
    }

    // -------------------------------------------------------------------------
    // Sending messages
    // -------------------------------------------------------------------------
    case 'START_SENDING':
      return {
        ...state,
        messages: action.messages,
        streamingContent: '',
        isSending: true,
        error: null,
        activeTools: [],
        pendingInput: action.keepPendingInput ? state.pendingInput : null,
      };

    case 'APPEND_STREAMING':
      return {
        ...state,
        streamingContent: state.streamingContent + action.chunk,
      };

    case 'COMPLETE_SENDING':
      return {
        ...state,
        messages: action.message ? [...state.messages, action.message] : state.messages,
        streamingContent: '',
        isSending: false,
        error: null,
        routineProgress: null,
        mealProgress: null,
      };

    case 'CANCEL_STREAM':
      return {
        ...state,
        streamingContent: '',
        isSending: false,
        pendingInput: null,
      };

    case 'SET_ERROR':
      return {
        ...state,
        messages: action.rollbackLastMessage ? state.messages.slice(0, -1) : state.messages,
        streamingContent: '',
        isSending: false,
        error: action.error,
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    // -------------------------------------------------------------------------
    // Tool status
    // -------------------------------------------------------------------------
    case 'TOOL_START':
      return {
        ...state,
        activeTools: [
          ...state.activeTools,
          {
            toolCallId: action.event.toolCallId,
            name: action.event.name as AIToolName,
            status: 'running',
          },
        ],
      };

    case 'TOOL_DONE':
      return {
        ...state,
        activeTools: state.activeTools.map((tool) =>
          tool.toolCallId === action.event.toolCallId
            ? { ...tool, status: action.event.success ? 'completed' : 'error', error: action.event.error }
            : tool
        ),
      };

    case 'CLEANUP_TOOLS':
      return {
        ...state,
        activeTools: state.activeTools.filter((t) => t.status !== action.status),
      };

    // -------------------------------------------------------------------------
    // Pending states
    // -------------------------------------------------------------------------
    case 'SET_PENDING_INPUT':
      return {
        ...state,
        pendingInput: action.input,
        isSending: action.input ? false : state.isSending,
      };

    case 'SET_PENDING_START':
      return { ...state, pendingStart: action.pending };

    case 'SUBMIT_INPUT':
      return {
        ...state,
        messages: action.messages,
        pendingInput: null,
      };

    // -------------------------------------------------------------------------
    // Routine
    // -------------------------------------------------------------------------
    case 'SET_ROUTINE_PREVIEW':
      return {
        ...state,
        pendingRoutinePreview: action.preview,
        pendingInput: null,
        routineProgress: null,
        isSending: false,
      };

    case 'SET_APPLIED_ROUTINE':
      return {
        ...state,
        appliedRoutine: action.event,
        pendingRoutinePreview: null,
      };

    case 'SET_ROUTINE_PROGRESS':
      return { ...state, routineProgress: action.progress };

    case 'CLEAR_ROUTINE_PREVIEW':
      return { ...state, pendingRoutinePreview: null };

    // -------------------------------------------------------------------------
    // Meal
    // -------------------------------------------------------------------------
    case 'SET_MEAL_PREVIEW':
      return {
        ...state,
        pendingMealPreview: action.preview,
        pendingInput: null,
        mealProgress: null,
        isSending: false,
      };

    case 'SET_APPLIED_MEAL':
      return {
        ...state,
        appliedMealPlan: action.event,
        pendingMealPreview: null,
      };

    case 'SET_MEAL_PROGRESS':
      return { ...state, mealProgress: action.progress };

    case 'CLEAR_MEAL_PREVIEW':
      return { ...state, pendingMealPreview: null };

    // -------------------------------------------------------------------------
    // Profile confirmation
    // -------------------------------------------------------------------------
    case 'SET_PROFILE_CONFIRMATION':
      return {
        ...state,
        pendingProfileConfirmation: action.confirmation,
        isSending: action.confirmation ? false : state.isSending,
      };

    case 'CLEAR_PROFILE_CONFIRMATION':
      return { ...state, pendingProfileConfirmation: null };

    // -------------------------------------------------------------------------
    // Apply preview (routine/meal)
    // -------------------------------------------------------------------------
    case 'START_APPLYING':
      return { ...state, isSending: true, error: null };

    case 'APPLY_ROUTINE_SUCCESS':
      return {
        ...state,
        isSending: false,
        pendingRoutinePreview: null,
        appliedRoutine: action.event,
      };

    case 'APPLY_MEAL_SUCCESS':
      return {
        ...state,
        isSending: false,
        pendingMealPreview: null,
        appliedMealPlan: action.event,
      };

    case 'APPLY_ERROR':
      return {
        ...state,
        isSending: false,
        error: action.error,
      };

    default:
      return state;
  }
}

