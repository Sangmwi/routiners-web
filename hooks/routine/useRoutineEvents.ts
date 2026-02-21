'use client';

/**
 * @deprecated 직접 queries.ts와 mutations.ts에서 import하세요.
 *
 * 이 파일은 하위 호환성을 위해 유지됩니다.
 *
 * @example
 * // Before
 * import { useRoutineEvents, useCreateRoutineEvent } from '@/hooks/routine/useRoutineEvents';
 *
 * // After
 * import { useRoutineEvents, useRoutineEventsSuspense } from '@/hooks/routine/queries';
 * import { useCreateRoutineEvent } from '@/hooks/routine/mutations';
 */

// Re-export all queries
export {
  useRoutineEvents,
  useUpcomingEvents,
  useRoutineEventByDate,
  useRoutineEvent,
  useCalendarEvents,
  useRoutineEventsSuspense,
  useRoutineEventByDateSuspense,
  useRoutineEventSuspense,
  useCalendarEventsSuspense,
} from './queries';

// Re-export all mutations
export {
  useCreateRoutineEvent,
  useCreateRoutineEventsBatch,
  useUpdateRoutineEvent,
  useCompleteRoutineEvent,
  useUpdateWorkoutData,
  useDeleteRoutineEvent,
  useDeleteRoutineEventsBySession,
} from './mutations';
