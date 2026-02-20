'use client';

import { TodaySection } from './today';
import { WeeklyOverview } from './weekly';
import { UpcomingSection } from './upcoming';
import { CounselorButton } from '@/components/counselor';
import {
  useWeeklyStatsSuspense,
  useUpcomingEventsSuspense,
  useRoutineEventByDateSuspense,
  useSeedEventCache,
} from '@/hooks/routine';
import { useActiveCounselorConversation } from '@/hooks/counselor';
import { formatDate } from '@/lib/utils/dateHelpers';

/**
 * 루틴 페이지 메인 콘텐츠
 *
 * 구조:
 * 1. 오늘 섹션 (Hero) - 즉시 행동 가능
 * 2. 이번 주 현황 - 진행 상태 한눈에
 * 3. 다가오는 루틴 - 컴팩트 리스트
 * 4. AI 상담 버튼 - 플로팅
 */
export default function RoutineContent() {
  const today = formatDate(new Date());

  // 데이터 페칭 (병렬)
  const weeklyStats = useWeeklyStatsSuspense();

  // 오늘의 이벤트 조회
  const { data: todayWorkout } = useRoutineEventByDateSuspense(today, 'workout');
  const { data: todayMeal } = useRoutineEventByDateSuspense(today, 'meal');

  // 미래 이벤트 조회 (다가오는 루틴용)
  const { data: workoutEvents } = useUpcomingEventsSuspense('workout', 0, 14);
  const { data: mealEvents } = useUpcomingEventsSuspense('meal', 0, 14);

  // 리스트 데이터 → 개별 byDate 캐시 시딩 (상세 페이지 즉시 전환용)
  useSeedEventCache(workoutEvents);
  useSeedEventCache(mealEvents);

  // 활성 상담 대화 확인 (non-blocking)
  const { data: activeConversation } = useActiveCounselorConversation();

  // 운동 + 식단 이벤트 합치기
  const allUpcomingEvents = [...(workoutEvents || []), ...(mealEvents || [])];

  return (
    <div className="space-y-8">
      {/* 1. 오늘 섹션 */}
      <TodaySection
        workoutEvent={todayWorkout || null}
        mealEvent={todayMeal || null}
      />

      {/* 2. 이번 주 현황 */}
      <WeeklyOverview stats={weeklyStats} />

      {/* 3. 다가오는 루틴 */}
      <UpcomingSection events={allUpcomingEvents} maxItems={5} />

      {/* 4. AI 상담 플로팅 버튼 */}
      <CounselorButton activeConversation={activeConversation} />
    </div>
  );
}
