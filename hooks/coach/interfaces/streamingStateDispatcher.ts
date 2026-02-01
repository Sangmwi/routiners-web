/**
 * Streaming State Dispatcher Interface
 *
 * 스트리밍 상태 관리 인터페이스 (DIP)
 * 구체적인 dispatch 구현에서 분리하여 테스트 및 확장 가능
 */

import type { ChatMessage } from '@/lib/types/chat';
import type { AIToolName } from '@/lib/types/fitness';
import type { RoutineAppliedEvent, RoutineProgressEvent } from '@/lib/api/conversation';
import type { SummarizationState } from '@/lib/types/coach';

/**
 * 스트리밍 상태 디스패처 인터페이스
 *
 * 스트리밍 관련 상태 변경만 담당 (SRP)
 */
export interface StreamingStateDispatcher {
  /** 스트리밍 시작 */
  startStreaming(pendingMessage: ChatMessage): void;

  /** 스트리밍 청크 추가 */
  appendChunk(chunk: string): void;

  /** 스트리밍 완료 */
  completeStreaming(): void;

  /** 스트리밍 콘텐츠 클리어 */
  clearStreamingContent(): void;

  /** 에러 설정 */
  setError(error: string): void;

  /** 에러 클리어 */
  clearError(): void;

  /** 스트리밍 취소 */
  cancelStream(): void;

  /** 낙관적 사용자 메시지 클리어 */
  clearPendingUserMessage(): void;

  /** 도구 시작 */
  toolStart(toolCallId: string, name: AIToolName): void;

  /** 도구 완료 */
  toolDone(toolCallId: string, success: boolean): void;

  /** 도구 리셋 */
  resetTools(): void;

  /** 적용된 루틴 설정 */
  setAppliedRoutine(event: RoutineAppliedEvent): void;

  /** 루틴 진행률 설정 */
  setRoutineProgress(event: RoutineProgressEvent): void;

  /** 요약 상태 설정 */
  setSummarization(state: SummarizationState): void;

  /** 전체 상태 리셋 */
  resetAll(): void;
}
