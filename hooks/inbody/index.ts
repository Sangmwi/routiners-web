/**
 * InBody Hooks Module
 *
 * InBody 기록 관리를 위한 React Query 훅 모음
 */

export {
  // Query Hooks
  useInBodyRecords,
  useLatestInBody,
  useInBodySummary,
  useUserInBodySummary,
  useInBodyRecord,
  // Mutation Hooks
  useCreateInBody,
  useUpdateInBody,
  useDeleteInBody,
} from './useInBody';

// Page-level State Management
export { useInBodyManager } from './useInBodyManager';
