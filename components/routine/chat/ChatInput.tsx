'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ArrowUpIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** AI 응답 대기 중 */
  isLoading?: boolean;
}

/**
 * 채팅 입력 컴포넌트 — ChatGPT 스타일
 *
 * - rounded-2xl pill 인풋 + 내부 전송 버튼
 * - gradient 배경으로 콘텐츠와 자연스러운 분리
 * - textarea 자동 높이 조절 (최대 120px)
 */
export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = '메시지를 입력하세요...',
  isLoading = false,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트 영역 높이 자동 조절
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
      // 높이 리셋
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter로 전송, Shift+Enter로 줄바꿈
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = message.trim().length > 0 && !disabled && !isLoading;
  const displayPlaceholder = isLoading ? '응답을 기다리는 중...' : placeholder;

  return (
    <div className="shrink-0 bg-background">
      <div className="h-4 bg-gradient-to-t from-background to-transparent -mt-4 pointer-events-none" />
      <div className="px-4 pb-4">
        <div className="relative flex items-end">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={displayPlaceholder}
            disabled={disabled || isLoading}
            rows={1}
            className="w-full resize-none rounded-2xl bg-surface-secondary border border-edge-subtle pl-4 pr-12 py-3 text-sm placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-focus disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`absolute right-1.5 bottom-1.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              canSend
                ? 'bg-primary text-primary-foreground active:scale-95'
                : 'bg-surface-hover text-hint-faint cursor-not-allowed'
            }`}
            aria-label="메시지 전송"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" variant="current" />
            ) : (
              <ArrowUpIcon size={16} weight="bold" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
