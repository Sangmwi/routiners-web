'use client';

import { ChatMessage as ChatMessageType } from '@/lib/types/routine';
import { RobotIcon } from '@phosphor-icons/react';
import { Markdown } from '@/components/common/Markdown';

interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * 개별 채팅 메시지 컴포넌트
 */
export default function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex gap-3 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* 아바타 */}
      {isAssistant && (
        <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground"
      >
        <RobotIcon size={16} weight="fill" />
      </div>
      )}

      {/* 메시지 버블 */}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl wrap-break-word overflow-hidden ${
          isAssistant
            ? 'bg-muted/40 rounded-tl-none'
            : 'bg-primary text-primary-foreground rounded-tr-none'
        }`}
      >
        {isAssistant ? (
          <Markdown content={message.content} />
        ) : (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}
