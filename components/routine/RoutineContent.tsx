'use client';

import { RoutineSection, WeeklyProgressCard } from '@/components/routine';
import { CoachButton } from '@/components/coach';
import { useUpcomingEventsSuspense } from '@/hooks/routine';
import { useActiveCoachConversation } from '@/hooks/coach';

/**
 * 루틴 페이지 콘텐츠 (Suspense 내부)
 *
 * - useSuspenseQuery로 운동/식단 이벤트 조회
 * - 상위 page.tsx의 Suspense boundary에서 로딩 처리
 */
export default function RoutineContent() {
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
