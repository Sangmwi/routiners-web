'use client';

import { useRef, useEffect, useState } from 'react';
import { ChatMessage as ChatMessageType } from '@/lib/types/routine';
import { AIToolStatus } from '@/lib/types/fitness';
import ChatMessage from './ChatMessage';
import ToolStatusIndicator from './ToolStatusIndicator';
import { Loader2 } from 'lucide-react';

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading?: boolean;
  streamingContent?: string;
  /** AI 도구 실행 상태 */
  activeTools?: AIToolStatus[];
}

/**
 * 채팅 메시지 목록 컴포넌트
 *
 * 도구 상태는 마지막 사용자 메시지 바로 다음에 고정 위치로 표시됩니다.
 * 레이아웃 시프트 없이 제자리에서 업데이트됩니다.
 */
export default function ChatMessageList({
  messages,
  isLoading = false,
  streamingContent,
  activeTools = [],
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // fade-out 효과를 위한 상태 관리
  const [visibleTools, setVisibleTools] = useState<AIToolStatus[]>([]);
  const [isExiting, setIsExiting] = useState(false);

  // activeTools 변경 시 처리
  useEffect(() => {
    if (activeTools.length > 0) {
      // 새로운 도구가 들어오면 즉시 표시
      setVisibleTools(activeTools);
      setIsExiting(false);
    } else if (visibleTools.length > 0) {
      // 도구가 비어지면 fade-out 후 제거
      setIsExiting(true);
      const timer = setTimeout(() => {
        setVisibleTools([]);
        setIsExiting(false);
      }, 300); // fade-out 애니메이션 시간
      return () => clearTimeout(timer);
    }
  }, [activeTools, visibleTools.length]);

  // 새 메시지가 추가되면 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, activeTools]);

  // 마지막 사용자 메시지의 인덱스 찾기
  const lastUserMessageIndex = messages.reduce((lastIndex, msg, index) => {
    return msg.role === 'user' ? index : lastIndex;
  }, -1);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-4">
        {messages.map((message, index) => (
          <div key={message.id}>
            <ChatMessage message={message} />

            {/* 마지막 사용자 메시지 바로 다음에 도구 상태 표시 (고정 위치) */}
            {index === lastUserMessageIndex && visibleTools.length > 0 && (
              <div
                className={`mt-3 transition-all duration-300 ${
                  isExiting ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
                }`}
              >
                <ToolStatusIndicator activeTools={visibleTools} />
              </div>
            )}
          </div>
        ))}

        {/* 스트리밍 중인 메시지 */}
        {streamingContent && (
          <ChatMessage
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              createdAt: new Date().toISOString(),
            }}
          />
        )}

        {/* 로딩 인디케이터 */}
        {isLoading && !streamingContent && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
