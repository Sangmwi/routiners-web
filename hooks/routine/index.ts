/**
 * Routine Hooks
 *
 * 루틴 이벤트 관련 React Query 훅
 */

// Query Hooks (standard + Suspense)
export * from './queries';

// Mutation Hooks
export * from './mutations';

// Legacy re-export (deprecated - use queries.ts and mutations.ts directly)
export * from './useRoutineEvents';
export * from './useWeeklyStats';
