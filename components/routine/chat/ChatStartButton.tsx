'use client';

import { PlayIcon } from '@phosphor-icons/react';

interface ChatStartButtonProps {
  onStart: () => void;
}

/**
 * 대화 시작 버튼
 *
 * @description
 * 세션 시작을 유도하는 인라인 버튼 UI입니다.
 */
export function ChatStartButton({ onStart }: ChatStartButtonProps) {
  return (
    <div className="flex gap-3 items-start">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
        <PlayIcon size={16} weight="fill" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
        <p className="text-sm text-muted-foreground mb-3">무엇이든 물어볼 준비가 되셨나요?</p>
        <button
          type="button"
          onClick={onStart}
          className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <PlayIcon size={16} weight="fill" />
          시작하기
        </button>
      </div>
    </div>
  );
}
