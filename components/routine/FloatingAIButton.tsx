'use client';

import { useRouter } from 'next/navigation';
import { Bot, Sparkles } from 'lucide-react';
import { useModalStore } from '@/lib/stores/modalStore';

interface FloatingAIButtonProps {
  /** 운동 활성 세션 존재 여부 */
  hasWorkoutSession?: boolean;
  /** 식단 활성 세션 존재 여부 */
  hasMealSession?: boolean;
}

/**
 * AI 코치 접근용 플로팅 버튼
 *
 * 클릭 시 AI 선택 모달(운동/식단) 표시
 * 활성 세션이 있으면 Sparkle 인디케이터 표시
 */
export default function FloatingAIButton({
  hasWorkoutSession = false,
  hasMealSession = false,
}: FloatingAIButtonProps) {
  const router = useRouter();
  const openModal = useModalStore((state) => state.openModal);
  const hasAnySession = hasWorkoutSession || hasMealSession;

  const handleClick = () => {
    openModal('aiSelection', {
      workoutSessionActive: hasWorkoutSession,
      mealSessionActive: hasMealSession,
      onSelectPurpose: (purpose) => {
        // purpose 쿼리 파라미터와 함께 채팅 페이지로 이동
        router.push(`/routine/chat?purpose=${purpose}`);
      },
    });
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
      aria-label="AI 코치와 대화하기"
    >
      <Bot className="w-6 h-6" />

      {/* 활성 세션 인디케이터 */}
      {hasAnySession && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </span>
      )}
    </button>
  );
}
