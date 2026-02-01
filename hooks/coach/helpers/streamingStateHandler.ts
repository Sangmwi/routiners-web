/**
 * Streaming State Handler
 *
 * 스트리밍 상태 관리 전용 핸들러 (SRP)
 * dispatch를 인터페이스로 추상화하여 의존성 역전
 */

import type { Dispatch } from 'react';
import type { StreamingStateDispatcher } from '../interfaces/streamingStateDispatcher';
import type { CoachChatAction } from './coachReducer';
import type { ChatMessage } from '@/lib/types/chat';
import type { AIToolName } from '@/lib/types/fitness';
import type { RoutineAppliedEvent, RoutineProgressEvent } from '@/lib/api/conversation';
import type { SummarizationState } from '@/lib/types/coach';

/**
 * Dispatch 기반 스트리밍 상태 디스패처 구현
 *
 * 구체적인 dispatch를 인터페이스로 래핑 (DIP)
 */
export class DispatchStreamingStateHandler implements StreamingStateDispatcher {
  constructor(private dispatch: Dispatch<CoachChatAction>) {}

  startStreaming(pendingMessage: ChatMessage): void {
    this.dispatch({ type: 'START_STREAMING', pendingMessage });
  }

  appendChunk(chunk: string): void {
    this.dispatch({ type: 'APPEND_STREAMING', chunk });
  }

  completeStreaming(): void {
    this.dispatch({ type: 'COMPLETE_STREAMING' });
  }

  clearStreamingContent(): void {
    this.dispatch({ type: 'CLEAR_STREAMING_CONTENT' });
  }

  setError(error: string): void {
    this.dispatch({ type: 'SET_ERROR', error });
  }

  clearError(): void {
    this.dispatch({ type: 'CLEAR_ERROR' });
  }

  cancelStream(): void {
    this.dispatch({ type: 'CANCEL_STREAM' });
  }

  clearPendingUserMessage(): void {
    this.dispatch({ type: 'CLEAR_PENDING_USER_MESSAGE' });
  }

  toolStart(toolCallId: string, name: AIToolName): void {
    this.dispatch({ type: 'TOOL_START', toolCallId, name });
  }

  toolDone(toolCallId: string, success: boolean): void {
    this.dispatch({ type: 'TOOL_DONE', toolCallId, success });
  }

  resetTools(): void {
    this.dispatch({ type: 'RESET_TOOLS' });
  }

  setAppliedRoutine(event: RoutineAppliedEvent): void {
    this.dispatch({ type: 'SET_APPLIED_ROUTINE', event });
  }

  setRoutineProgress(event: RoutineProgressEvent): void {
    this.dispatch({ type: 'SET_ROUTINE_PROGRESS', event });
  }

  setSummarization(state: SummarizationState): void {
    this.dispatch({ type: 'SET_SUMMARIZATION', state });
  }

  resetAll(): void {
    this.dispatch({ type: 'RESET_ALL' });
  }
}
