'use client';

import ChatMessage from './ChatMessage';

interface ChatStreamingMessageProps {
  content: string;
}

/**
 * 스트리밍 중인 AI 응답 메시지
 *
 * @description
 * SSE 스트리밍으로 수신 중인 AI 응답을 실시간으로 표시합니다.
 */
export function ChatStreamingMessage({ content }: ChatStreamingMessageProps) {
  return (
    <div>
      <ChatMessage
        message={{
          id: 'streaming',
          conversationId: '',
          role: 'assistant',
          content,
          contentType: 'text',
          createdAt: new Date().toISOString(),
        }}
      />
    </div>
  );
}
