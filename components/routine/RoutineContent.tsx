'use client';

import { WeeklyOverview } from './weekly';
import { UpcomingSection } from './upcoming';
import TodayRoutineCard from '@/components/home/TodayRoutineCard';
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
 * 1. 이번 주 현황 - 주간 관점 (최상단)
 * 2. 오늘 섹션 - 2열 카드 (홈과 동일한 레이아웃)
 * 3. 다가오는 루틴 - 필터 칩 + 컴팩트 리스트
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

  // 다음 예정 운동 파생 (쉬는날 vs 미등록 구분용, 추가 API 호출 없음)
  const nextScheduledWorkout = !todayWorkout
    ? workoutEvents?.find((e) => e.date > today && e.status === 'scheduled') ?? null
    : null;

  // 리스트 데이터 → 개별 byDate 캐시 시딩 (상세 페이지 즉시 전환용)
  useSeedEventCache(workoutEvents);
  useSeedEventCache(mealEvents);

  // 활성 상담 대화 확인 (non-blocking)
  const { data: activeConversation } = useActiveCounselorConversation();

  // 운동 + 식단 이벤트 합치기
  const allUpcomingEvents = [...(workoutEvents || []), ...(mealEvents || [])];

  return (
    <div className="space-y-10">
      {/* 1. 이번 주 현황 (최상단) */}
      <WeeklyOverview stats={weeklyStats} />

      {/* 2. 오늘 섹션 (2열 카드, 홈과 동일) */}
      <TodayRoutineCard
        workoutEvent={todayWorkout || null}
        mealEvent={todayMeal || null}
        nextScheduledWorkout={nextScheduledWorkout}
      />

      {/* 3. 다가오는 루틴 (필터 칩 포함) */}
      <UpcomingSection events={allUpcomingEvents} maxItems={5} />

      {/* 4. AI 상담 버튼 */}
      <CounselorButton activeConversation={activeConversation} />
    </div>
  );
}
