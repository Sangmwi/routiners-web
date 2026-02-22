'use client';

import { useSuspenseQueries } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import { profileApi } from '@/lib/api/profile';
import { routineEventApi, type EventListParams } from '@/lib/api/routineEvent';
import { inbodyApi } from '@/lib/api/inbody';
import { progressApi } from '@/lib/api/progress';
import { formatDate, addDays } from '@/lib/utils/dateHelpers';
import { STALE_TIME } from '@/hooks/common/useBaseQuery';
import type { User } from '@/lib/types/user';
import type { RoutineEvent } from '@/lib/types/routine';
import type { InBodySummary, InBodyRecord } from '@/lib/types/inbody';
import type { ProgressSummary } from '@/lib/types/progress';

export interface HomeData {
  user: User;
  todayWorkout: RoutineEvent | null;
  todayMeal: RoutineEvent | null;
  nextScheduledWorkout: RoutineEvent | null;
  inbodySummary: InBodySummary;
  inbodyHistory: InBodyRecord[];
  progressSummary: ProgressSummary;
}

/**
 * 홈 페이지 전체 데이터 병렬 조회 (Suspense)
 *
 * 6개 독립 쿼리를 useSuspenseQueries로 병렬 실행하여
 * Suspense waterfall 문제를 해결합니다.
 *
 * Query key는 개별 훅과 동일하여 캐시 공유 및 무효화가 유지됩니다.
 */
export function useHomeDataSuspense(): HomeData {
  const today = formatDate(new Date());
  const tomorrow = formatDate(addDays(new Date(), 1));
  const futureLimit = formatDate(addDays(new Date(), 30));

  const nextWorkoutParams: EventListParams = {
    startDate: tomorrow,
    endDate: futureLimit,
    type: 'workout',
    status: 'scheduled',
    limit: 1,
  };

  const [
    userResult,
    todayWorkoutResult,
    todayMealResult,
    nextWorkoutResult,
    inbodyResult,
    inbodyHistoryResult,
    progressResult,
  ] = useSuspenseQueries({
    queries: [
      {
        queryKey: queryKeys.user.me(),
        queryFn: profileApi.getCurrentUserProfile,
        staleTime: STALE_TIME.default,
      },
      {
        queryKey: queryKeys.routineEvent.byDate(today, 'workout'),
        queryFn: () => routineEventApi.getEventByDate(today, 'workout'),
        staleTime: STALE_TIME.default,
      },
      {
        queryKey: queryKeys.routineEvent.byDate(today, 'meal'),
        queryFn: () => routineEventApi.getEventByDate(today, 'meal'),
        staleTime: STALE_TIME.default,
      },
      {
        queryKey: queryKeys.routineEvent.list(nextWorkoutParams),
        queryFn: () => routineEventApi.getEvents(nextWorkoutParams),
        staleTime: STALE_TIME.default,
      },
      {
        queryKey: queryKeys.inbody.summary(),
        queryFn: inbodyApi.getSummary,
        staleTime: STALE_TIME.default,
      },
      {
        queryKey: queryKeys.inbody.list(8, 0),
        queryFn: () => inbodyApi.getRecords(8, 0),
        staleTime: STALE_TIME.default,
      },
      {
        queryKey: queryKeys.progress.summary(6),
        queryFn: () => progressApi.getSummary(6),
        staleTime: STALE_TIME.default,
      },
    ],
  });

  const nextWorkoutEvents = nextWorkoutResult.data as RoutineEvent[];

  return {
    user: userResult.data as User,
    todayWorkout: todayWorkoutResult.data as RoutineEvent | null,
    todayMeal: todayMealResult.data as RoutineEvent | null,
    nextScheduledWorkout: nextWorkoutEvents[0] ?? null,
    inbodySummary: inbodyResult.data as InBodySummary,
    inbodyHistory: inbodyHistoryResult.data as InBodyRecord[],
    progressSummary: progressResult.data as ProgressSummary,
  };
}
