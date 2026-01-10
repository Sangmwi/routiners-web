'use client';

import { ChatMessage as ChatMessageType } from '@/lib/types/routine';
import { Bot, User } from 'lucide-react';
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
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isAssistant
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isAssistant ? (
          <Bot className="w-4 h-4" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>

      {/* 메시지 버블 */}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isAssistant
            ? 'bg-card border border-border rounded-tl-md'
            : 'bg-primary text-primary-foreground rounded-tr-md'
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
