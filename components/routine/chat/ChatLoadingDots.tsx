'use client';

import { LoadingSpinner } from '@/components/ui/icons';

/**
 * 채팅 로딩 인디케이터
 *
 * @description
 * AI 응답 대기 중에 표시되는 점 애니메이션 로딩 UI입니다.
 */
export function ChatLoadingDots() {
  return (
    <div className="flex gap-3 mt-2">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
        <LoadingSpinner size="sm" variant="current" />
      </div>
      <div className="bg-card rounded-2xl rounded-tl-none px-4 py-3 mt-2">
        <div className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
