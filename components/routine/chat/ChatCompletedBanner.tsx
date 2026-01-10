'use client';

import { CheckCircle, Trash2, Utensils } from 'lucide-react';
import ViewMoreButton from '@/components/ui/ViewMoreButton';
import type { AppliedRoutineMetadata, SessionPurpose } from '@/lib/types/chat';
import type { RoutineAppliedEvent, MealPlanAppliedEvent } from '@/lib/api/conversation';

interface ChatCompletedBannerProps {
  /** 세션 목적 (workout | meal) */
  purpose?: SessionPurpose;
  /** 적용된 루틴 정보 (SSE 이벤트 또는 DB 메타데이터) */
  appliedRoutine?: RoutineAppliedEvent | AppliedRoutineMetadata | null;
  /** 적용된 식단 정보 */
  appliedMealPlan?: MealPlanAppliedEvent | null;
  /** 캘린더로 이동 콜백 */
  onNavigateToCalendar: () => void;
  /** 대화 삭제 콜백 */
  onDeleteChat: () => void;
}

/**
 * 완료된 채팅방 하단 배너
 *
 * - 루틴 생성 완료 안내 메시지
 * - 적용된 루틴 정보 표시
 * - 내 캘린더로 이동 버튼 (primary)
 * - 대화 삭제 버튼 (secondary)
 */
export default function ChatCompletedBanner({
  purpose = 'workout',
  appliedRoutine,
  appliedMealPlan,
  onNavigateToCalendar,
  onDeleteChat,
}: ChatCompletedBannerProps) {
  const isMeal = purpose === 'meal';
  const appliedData = isMeal ? appliedMealPlan : appliedRoutine;

  return (
    <div className="p-4 border-t border-border bg-card">
      <div className="flex items-center gap-3 mb-3">
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isMeal ? 'bg-lime-500/10' : 'bg-green-500/10'
        }`}>
          {isMeal ? (
            <Utensils className="w-4 h-4 text-lime-600" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {isMeal ? '식단이 적용되었습니다!' : '루틴이 적용되었습니다!'}
          </p>
          {appliedData && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {isMeal
                ? `${appliedData.eventsCreated}일 분의 식단이 ${appliedData.startDate}부터 시작됩니다.`
                : `${appliedData.eventsCreated}개의 운동이 ${appliedData.startDate}부터 시작됩니다.`
              }
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onDeleteChat}
          className="flex items-center justify-center gap-1.5 flex-1 py-2.5 px-4 text-sm font-medium text-muted-foreground border border-border rounded-xl hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          대화 삭제
        </button>
        <ViewMoreButton onClick={onNavigateToCalendar} variant="primary" className="flex-1 justify-center">
          내 캘린더로
        </ViewMoreButton>
      </div>
    </div>
  );
}
