'use client';

import { CheckIcon } from '@phosphor-icons/react';
import type { AppliedRoutineMetadata, SessionPurpose } from '@/lib/types/chat';
import type { RoutineAppliedEvent, MealPlanAppliedEvent } from '@/lib/api/conversation';
import { getEventIcon } from '@/lib/config/eventTheme';

interface ChatCompletedBannerProps {
  /** 세션 목적 (workout | meal) */
  purpose?: SessionPurpose;
  /** 적용된 루틴 정보 (SSE 이벤트 또는 DB 메타데이터) */
  appliedRoutine?: RoutineAppliedEvent | AppliedRoutineMetadata | null;
  /** 적용된 식단 정보 */
  appliedMealPlan?: MealPlanAppliedEvent | null;
  /** 캘린더로 이동 콜백 */
  onNavigateToCalendar: () => void;
}

/**
 * 완료된 채팅방 하단 배너 - 중앙 정렬 + 블러 효과
 */
export default function ChatCompletedBanner({
  purpose = 'workout',
  appliedRoutine,
  appliedMealPlan,
  onNavigateToCalendar,
}: ChatCompletedBannerProps) {
  const isMeal = purpose === 'meal';
  const appliedData = isMeal ? appliedMealPlan : appliedRoutine;

  const Icon = isMeal ? getEventIcon('meal') : CheckIcon;

  return (
    <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-md">
      <div className="flex flex-col items-center text-center">
        {/* 아이콘 */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>

        {/* 타이틀 */}
        <p className="text-sm font-semibold text-foreground">
          {isMeal ? '식단 적용 완료' : '루틴 적용 완료'}
        </p>

        {/* 상세 정보 */}
        {appliedData && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {appliedData.eventsCreated}개 · {appliedData.startDate} 시작
          </p>
        )}

        {/* CTA 버튼 */}
        <button
          onClick={onNavigateToCalendar}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90"
        >
          캘린더에서 확인
        </button>
      </div>
    </div>
  );
}
