'use client';

import { useRouter } from 'next/navigation';
import { Bot, Sparkles } from 'lucide-react';

interface FloatingAIButtonProps {
  hasActiveSession?: boolean;
}

/**
 * AI 트레이너 접근용 플로팅 버튼
 */
export default function FloatingAIButton({
  hasActiveSession = false,
}: FloatingAIButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/routine/chat')}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
      aria-label="AI 트레이너와 대화하기"
    >
      <Bot className="w-6 h-6" />

      {/* 활성 세션 인디케이터 */}
      {hasActiveSession && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </span>
      )}
    </button>
  );
}
