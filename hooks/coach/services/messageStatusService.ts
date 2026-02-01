/**
 * Message Status Service
 *
 * 메시지 상태 업데이트 API 호출 서비스 (SRP)
 * 순수 API 호출만 담당, React Query나 상태 관리와 무관
 */

export type MessageStatus =
  | 'pending'
  | 'confirmed'
  | 'edited'
  | 'applied'
  | 'cancelled'
  | 'submitted';

export interface UpdateMessageStatusParams {
  conversationId: string;
  messageId: string;
  status: MessageStatus;
  submittedValue?: string;
}

export interface UpdateMessageStatusResult {
  success: boolean;
  status: MessageStatus;
  messageId: string;
}

/**
 * 메시지 상태 업데이트 서비스
 *
 * 순수 API 호출만 담당 (SRP)
 */
export class MessageStatusService {
  /**
   * 메시지 상태 업데이트
   */
  static async updateStatus(
    params: UpdateMessageStatusParams
  ): Promise<UpdateMessageStatusResult> {
    const { conversationId, messageId, status, submittedValue } = params;

    const response = await fetch(
      `/api/coach/conversations/${conversationId}/messages/${messageId}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ...(submittedValue !== undefined && { submittedValue }),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      throw new Error(
        errorData.error || `Failed to update message status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  }
}
