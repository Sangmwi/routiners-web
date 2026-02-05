'use client';

import { RoutineSection, WeeklyProgressCard } from '@/components/routine';
import { CoachButton } from '@/components/coach';
import { useUpcomingEventsSuspense, useWeeklyStatsSuspense } from '@/hooks/routine';
import { useActiveCoachConversation } from '@/hooks/coach';

/**
 * 루틴 페이지 콘텐츠 (Suspense 내부)
 *
 * - 모든 Suspense 쿼리를 상단에서 병렬 호출 (React Query 자동 처리)
 * - 상위 page.tsx의 Suspense boundary에서 로딩 처리
 */
export default function RoutineContent() {
  // 주간 통계 조회 (Suspense) - 병렬 fetch
  const weeklyStats = useWeeklyStatsSuspense();

  // 과거 7일 + 오늘 + 미래 14일 이벤트 조회 (Suspense) - 병렬 fetch
  const { data: workoutEvents } = useUpcomingEventsSuspense('workout', 7, 14);
  const { data: mealEvents } = useUpcomingEventsSuspense('meal', 7, 14);

  // 활성 코치 대화 확인 (non-blocking)
  const { data: activeConversation } = useActiveCoachConversation();

  return (
    <>
      {/* 주간 통계 카드 */}
      <WeeklyProgressCard stats={weeklyStats} />

      {/* 운동 섹션 */}
      <RoutineSection type="workout" events={workoutEvents} />

      {/* 식단 섹션 */}
      <RoutineSection type="meal" events={mealEvents} />

      {/* AI 코치 플로팅 버튼 */}
      <CoachButton activeConversation={activeConversation} />
    </>
  );
}
