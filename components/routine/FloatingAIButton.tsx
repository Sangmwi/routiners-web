'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Sparkles, Loader2 } from 'lucide-react';
import { useModalStore } from '@/lib/stores/modalStore';
import { useShowError } from '@/lib/stores/errorStore';
import { useCreateAISession } from '@/hooks/aiChat';
import type { AISessionCompat } from '@/lib/types/chat';
import type { SessionPurpose } from '@/lib/types/routine';

interface FloatingAIButtonProps {
  /** 운동 활성 세션 */
  workoutSession?: AISessionCompat | null;
  /** 식단 활성 세션 */
  mealSession?: AISessionCompat | null;
}

/**
 * AI 코치 접근용 플로팅 버튼
 *
 * 클릭 시 AI 선택 모달(운동/식단) 표시
 * - 활성 세션 있음 → 해당 세션으로 바로 이동
 * - 활성 세션 없음 → 새 세션 생성 후 이동
 */
export default function FloatingAIButton({
  workoutSession,
  mealSession,
}: FloatingAIButtonProps) {
  const router = useRouter();
  const openModal = useModalStore((state) => state.openModal);
  const closeCurrentModal = useModalStore((state) => state.closeCurrentModal);
  const createSession = useCreateAISession();
  const showError = useShowError();
  const [isNavigating, setIsNavigating] = useState(false);

  const hasAnySession = !!workoutSession || !!mealSession;

  const handleSelectPurpose = async (purpose: SessionPurpose) => {
    // 이미 처리 중이면 무시
    if (isNavigating || createSession.isPending) return;

    const existingSession = purpose === 'workout' ? workoutSession : mealSession;

    if (existingSession) {
      // 활성 세션이 있으면 바로 이동
      closeCurrentModal();
      router.push(`/routine/chat?session=${existingSession.id}`);
    } else {
      // 활성 세션이 없으면 생성 후 이동
      setIsNavigating(true);
      try {
        const newSession = await createSession.mutateAsync({ purpose });
        closeCurrentModal();
        router.push(`/routine/chat?session=${newSession.id}`);
      } catch (error) {
        console.error('[FloatingAIButton] Session creation failed:', error);
        showError('AI 코치 연결에 실패했습니다');
        setIsNavigating(false);
      }
    }
  };

  const handleClick = () => {
    openModal('aiSelection', {
      workoutSessionActive: !!workoutSession,
      mealSessionActive: !!mealSession,
      isLoading: isNavigating || createSession.isPending,
      onSelectPurpose: handleSelectPurpose,
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isNavigating || createSession.isPending}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      aria-label="AI 코치와 대화하기"
    >
      {isNavigating || createSession.isPending ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <Bot className="w-6 h-6" />
      )}

      {/* 활성 세션 인디케이터 */}
      {hasAnySession && !isNavigating && !createSession.isPending && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </span>
      )}
    </button>
  );
}
