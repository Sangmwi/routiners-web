'use client';

/**
 * @deprecated 직접 queries.ts와 mutations.ts에서 import하세요.
 *
 * 이 파일은 하위 호환성을 위해 유지됩니다.
 *
 * @example
 * // Before
 * import { useInBodyRecords, useCreateInBody } from '@/hooks/inbody/useInBody';
 *
 * // After
 * import { useInBodyRecords, useInBodyRecordsSuspense } from '@/hooks/inbody/queries';
 * import { useCreateInBody } from '@/hooks/inbody/mutations';
 */

// Re-export all queries
export {
  useInBodyRecords,
  useLatestInBody,
  useInBodySummary,
  useUserInBodySummary,
  useInBodyRecord,
  useInBodyRecordsSuspense,
  useLatestInBodySuspense,
  useInBodySummarySuspense,
  useInBodyRecordSuspense,
} from './queries';

// Re-export all mutations
export {
  useCreateInBody,
  useUpdateInBody,
  useDeleteInBody,
} from './mutations';
