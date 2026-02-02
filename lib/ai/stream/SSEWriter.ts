/**
 * SSE Writer - Server-Sent Events 스트림 작성기
 *
 * Phase 17: route.ts SOLID 리팩토링
 * - SRP: SSE 이벤트 전송만 담당
 * - 상태 캡슐화: controllerClosed 내부 관리
 */

export class SSEWriter {
  private encoder = new TextEncoder();
  private closed = false;

  constructor(private controller: ReadableStreamDefaultController<Uint8Array>) {}

  /**
   * SSE 이벤트 전송
   * - 이미 닫힌 경우 무시
   * - Controller 닫힘 에러 핸들링
   */
  send(event: string, data: unknown): void {
    if (this.closed) return;

    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      this.controller.enqueue(this.encoder.encode(payload));
    } catch (error) {
      if ((error as Error)?.message?.includes('Controller is already closed')) {
        this.closed = true;
        console.warn('[SSE] Controller closed, skipping event:', event);
      } else {
        throw error;
      }
    }
  }

  /**
   * 스트림 종료
   */
  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.controller.close();
  }

  /**
   * 닫힘 상태 확인
   */
  get isClosed(): boolean {
    return this.closed;
  }
}
