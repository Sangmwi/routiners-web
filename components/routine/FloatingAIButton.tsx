'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RobotIcon, SparkleIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import { useShowError } from '@/lib/stores/errorStore';
import { useCreateAISession } from '@/hooks/aiChat';
import type { AISessionCompat } from '@/lib/types/chat';

interface FloatingAIButtonProps {
  /** 코치 활성 세션 */
  coachSession?: AISessionCompat | null;
}

/**
 * AI 코치 접근용 플로팅 버튼
 *
 * 클릭 시 바로 코치 대화방으로 이동
 * - 활성 세션 있음 → 해당 세션으로 바로 이동
 * - 활성 세션 없음 → 새 세션 생성 후 이동
 */
export default function FloatingAIButton({
  coachSession,
}: FloatingAIButtonProps) {
  const router = useRouter();
  const createSession = useCreateAISession();
  const showError = useShowError();
  const [isNavigating, setIsNavigating] = useState(false);

  const hasActiveSession = !!coachSession;

  const handleClick = () => {
    // 이미 처리 중이면 무시
    if (isNavigating || createSession.isPending) return;

    if (coachSession) {
      // 활성 세션이 있으면 바로 이동
      router.push(`/routine/chat?session=${coachSession.id}`);
    } else {
      // 활성 세션이 없으면 생성 후 이동
      setIsNavigating(true);
      createSession.mutate(
        { purpose: 'coach' },
        {
          onSuccess: (newSession) => {
            router.push(`/routine/chat?session=${newSession.id}`);
          },
          onError: () => {
            showError('AI 코치 연결에 실패했습니다');
            setIsNavigating(false);
          },
        }
      );
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isNavigating || createSession.isPending}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      aria-label="AI 코치와 대화하기"
    >
      {isNavigating || createSession.isPending ? (
        <LoadingSpinner size="lg" variant="current" />
      ) : (
        <RobotIcon size={24} weight="fill" />
      )}

      {/* 활성 세션 인디케이터 */}
      {hasActiveSession && !isNavigating && !createSession.isPending && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
          <SparkleIcon size={12} weight="fill" className="text-white" />
        </span>
      )}
    </button>
  );
}
