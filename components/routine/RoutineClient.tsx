'use client';

import { Suspense } from 'react';
import MainTabLayout from '@/components/common/MainTabLayout';
import MainTabHeader from '@/components/common/MainTabHeader';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import { RoutineSection, WeeklyProgressCard } from '@/components/routine';
import { CoachButton } from '@/components/coach';
import { useUpcomingEventsSuspense } from '@/hooks/routine';
import { useActiveCoachConversation } from '@/hooks/coach';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

// ============================================================================
// RoutineContent - Suspense 내부 컴포넌트
// ============================================================================

function RoutineContent() {
  // 과거 7일 + 오늘 + 미래 14일 이벤트 조회 (Suspense)
  const { data: workoutEvents } = useUpcomingEventsSuspense('workout', 7, 14);
  const { data: mealEvents } = useUpcomingEventsSuspense('meal', 7, 14);

  // 활성 코치 대화 확인 (non-blocking)
  const { data: activeConversation } = useActiveCoachConversation();

  return (
    <>
      {/* 주간 통계 카드 */}
      <WeeklyProgressCard />

      {/* 운동 섹션 */}
      <RoutineSection type="workout" events={workoutEvents} />

      {/* 식단 섹션 */}
      <RoutineSection type="meal" events={mealEvents} />

      {/* AI 코치 플로팅 버튼 */}
      <CoachButton activeConversation={activeConversation} />
    </>
  );
}

// ============================================================================
// RoutineClient - 메인 export
// ============================================================================

/**
 * 루틴 탭 메인 클라이언트 컴포넌트
 *
 * - 헤더 즉시 표시
 * - Suspense로 데이터 로딩 자동 관리
 * - QueryErrorBoundary로 에러 자동 처리
 */
export default function RoutineClient() {
  const today = new Date();

  return (
    <MainTabLayout>
      <MainTabHeader
        title="내 루틴"
        subtitle={formatKoreanDate(today, { weekday: true })}
      />
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <RoutineContent />
        </Suspense>
      </QueryErrorBoundary>
    </MainTabLayout>
  );
}
