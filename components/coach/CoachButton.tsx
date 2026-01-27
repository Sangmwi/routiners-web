'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RobotIcon, SparkleIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import { useShowError } from '@/lib/stores/errorStore';
import { useCreateCoachConversation } from '@/hooks/coach';
import type { CoachConversation } from '@/lib/types/coach';

interface CoachButtonProps {
  /** 활성 코치 대화 */
  activeConversation?: CoachConversation | null;
}

/**
 * AI 코치 접근용 플로팅 버튼
 *
 * 클릭 시 바로 코치 대화방으로 이동
 * - 활성 대화 있음 → 해당 대화로 바로 이동
 * - 활성 대화 없음 → 새 대화 생성 후 이동
 */
export default function CoachButton({
  activeConversation,
}: CoachButtonProps) {
  const router = useRouter();
  const createConversation = useCreateCoachConversation();
  const showError = useShowError();
  const [isNavigating, setIsNavigating] = useState(false);

  const hasActiveConversation = !!activeConversation;
  const hasActivePurpose = !!activeConversation?.metadata?.activePurpose;

  const handleClick = () => {
    // 이미 처리 중이면 무시
    if (isNavigating || createConversation.isPending) return;

    if (activeConversation) {
      // 활성 대화가 있으면 바로 이동
      router.push(`/routine/coach?id=${activeConversation.id}`);
    } else {
      // 활성 대화가 없으면 생성 후 이동
      setIsNavigating(true);
      createConversation.mutate(undefined, {
        onSuccess: (newConversation) => {
          router.push(`/routine/coach?id=${newConversation.id}`);
        },
        onError: () => {
          showError('AI 코치 연결에 실패했습니다');
          setIsNavigating(false);
        },
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isNavigating || createConversation.isPending}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      aria-label="AI 코치와 대화하기"
    >
      {isNavigating || createConversation.isPending ? (
        <LoadingSpinner size="lg" variant="current" />
      ) : (
        <RobotIcon size={24} weight="fill" />
      )}

      {/* 활성 목적 인디케이터 */}
      {hasActivePurpose && !isNavigating && !createConversation.isPending && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
          <SparkleIcon size={12} weight="fill" className="text-white" />
        </span>
      )}

      {/* 활성 대화 인디케이터 (목적 없을 때) */}
      {hasActiveConversation && !hasActivePurpose && !isNavigating && !createConversation.isPending && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success" />
      )}
    </button>
  );
}
