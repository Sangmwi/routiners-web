/**
 * InBody Hooks Module
 *
 * InBody 기록 관리를 위한 React Query 훅 모음
 */

// Query Hooks (standard + Suspense)
export * from './queries';

// Mutation Hooks
export * from './mutations';

// Legacy re-export (deprecated - use queries.ts and mutations.ts directly)
export * from './useInBody';

// Page-level State Management
export { useInBodyManagerSuspense } from './useInBodyManagerSuspense';
