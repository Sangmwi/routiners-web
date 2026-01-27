/**
 * SSE (Server-Sent Events) Utilities
 *
 * AI 채팅 스트리밍을 위한 SSE 이벤트 인코딩 및 관리 유틸리티
 */

// ============================================================================
// Types
// ============================================================================

/** SSE 이벤트 타입 정의 */
export type SSEEventType =
  | 'content'              // 텍스트 스트리밍 델타
  | 'tool_start'           // 도구 호출 시작
  | 'tool_done'            // 도구 호출 완료
  | 'input_request'        // 사용자 입력 요청
  | 'profile_confirmation' // 프로필 확인 요청
  | 'routine_preview'      // 루틴 미리보기
  | 'routine_progress'     // 루틴 생성 진행률
  | 'routine_applied'      // 루틴 적용 완료
  | 'done'                 // 스트리밍 완료
  | 'error';               // 에러 발생

/** SSE 이벤트 데이터 타입 매핑 */
export interface SSEEventDataMap {
  content: { content: string };
  tool_start: { toolCallId: string; name: string };
  tool_done: { toolCallId: string; name: string; success: boolean; data?: unknown; error?: string };
  input_request: { requestId: string; type: string; message?: string; options?: unknown[]; sliderConfig?: unknown };
  profile_confirmation: { requestId: string; title: string; description?: string; fields: unknown[] };
  routine_preview: { previewId: string; title: string; description: string; preview: unknown };
  routine_progress: { progress: number; stage: string };
  routine_applied: { eventsCreated: number; startDate: string };
  done: { messageId: string | null };
  error: { error: string; code?: string };
}

// ============================================================================
// SSE Encoder
// ============================================================================

/**
 * SSE 이벤트 인코더 생성
 *
 * @returns SSE 인코딩 유틸리티 객체
 */
export function createSSEEncoder() {
  const textEncoder = new TextEncoder();

  return {
    /**
     * SSE 이벤트를 인코딩된 바이트 배열로 변환
     */
    encode<T extends SSEEventType>(event: T, data: SSEEventDataMap[T]): Uint8Array {
      return textEncoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },

    /**
     * 완료 이벤트 인코딩 (DONE 마커 없이)
     */
    encodeDone(messageId: string | null): Uint8Array {
      return textEncoder.encode(`event: done\ndata: ${JSON.stringify({ messageId })}\n\n`);
    },

    /**
     * 에러 이벤트 인코딩
     */
    encodeError(error: string, code?: string): Uint8Array {
      return textEncoder.encode(`event: error\ndata: ${JSON.stringify({ error, code })}\n\n`);
    },
  };
}

// ============================================================================
// SSE Controller Wrapper
// ============================================================================

/**
 * SSE 컨트롤러 래퍼
 *
 * ReadableStreamDefaultController를 감싸서 에러 핸들링과 닫힘 상태 관리
 */
export function createSSEController(controller: ReadableStreamDefaultController<Uint8Array>) {
  const encoder = createSSEEncoder();
  let isClosed = false;

  return {
    /**
     * 이벤트 전송
     * 컨트롤러가 닫힌 경우 무시
     */
    sendEvent<T extends SSEEventType>(event: T, data: SSEEventDataMap[T]): boolean {
      if (isClosed) return false;

      try {
        controller.enqueue(encoder.encode(event, data));
        return true;
      } catch (error) {
        if ((error as Error)?.message?.includes('Controller is already closed')) {
          isClosed = true;
          console.warn('[SSE] Controller closed, skipping event:', event);
          return false;
        }
        throw error;
      }
    },

    /**
     * 완료 이벤트 전송 및 컨트롤러 닫기
     */
    complete(messageId: string | null): void {
      if (isClosed) return;

      try {
        controller.enqueue(encoder.encodeDone(messageId));
        isClosed = true;
        controller.close();
      } catch (error) {
        console.warn('[SSE] Error closing controller:', error);
        isClosed = true;
      }
    },

    /**
     * 에러 이벤트 전송 및 컨트롤러 닫기
     */
    error(message: string, code?: string): void {
      if (isClosed) return;

      try {
        controller.enqueue(encoder.encodeError(message, code));
        isClosed = true;
        controller.close();
      } catch (error) {
        console.warn('[SSE] Error closing controller:', error);
        isClosed = true;
      }
    },

    /**
     * 컨트롤러 닫힘 상태 확인
     */
    get closed(): boolean {
      return isClosed;
    },

    /**
     * 수동으로 닫힘 상태 설정
     */
    markClosed(): void {
      isClosed = true;
    },
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export type SSEEncoder = ReturnType<typeof createSSEEncoder>;
export type SSEController = ReturnType<typeof createSSEController>;
