'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InBodyRecord, InBodyUpdateData } from '@/lib/types';
import { inbodyApi } from '@/lib/api/inbody';
import { queryKeys } from '@/lib/constants/queryKeys';
import { invalidateInBodyCaches } from './cacheHelpers';

// ============================================================================
// InBody Mutations
// ============================================================================

/**
 * InBody 기록 생성 Mutation
 *
 * @example
 * const createInBody = useCreateInBody();
 *
 * createInBody.mutate(data, {
 *   onSuccess: () => {
 *     toast.success('인바디 기록이 저장되었습니다');
 *   },
 * });
 */
export function useCreateInBody() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inbodyApi.createRecord,

    onSuccess: (newRecord) => {
      queryClient.setQueryData(queryKeys.inbody.latest(), newRecord);
      invalidateInBodyCaches(queryClient);
    },

    onError: (error) => {
      console.error('[InBody] Create failed:', error);
    },
  });
}

/**
 * InBody 기록 수정 Mutation
 *
 * @example
 * const updateInBody = useUpdateInBody();
 *
 * updateInBody.mutate({ id: 'record-id', data: { weight: 75 } });
 */
export function useUpdateInBody() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InBodyUpdateData }) =>
      inbodyApi.updateRecord(id, data),

    onSuccess: (updatedRecord) => {
      queryClient.setQueryData(queryKeys.inbody.detail(updatedRecord.id), updatedRecord);
      const latestRecord = queryClient.getQueryData<InBodyRecord>(queryKeys.inbody.latest());
      if (latestRecord?.id === updatedRecord.id) {
        queryClient.setQueryData(queryKeys.inbody.latest(), updatedRecord);
      }
      invalidateInBodyCaches(queryClient);
    },

    onError: (error) => {
      console.error('[InBody] Update failed:', error);
    },
  });
}

/**
 * InBody 기록 삭제 Mutation
 *
 * @example
 * const deleteInBody = useDeleteInBody();
 *
 * deleteInBody.mutate('record-id', {
 *   onSuccess: () => {
 *     toast.success('기록이 삭제되었습니다');
 *   },
 * });
 */
export function useDeleteInBody() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inbodyApi.deleteRecord,

    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.inbody.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inbody.latest() });
      invalidateInBodyCaches(queryClient);
    },

    onError: (error) => {
      console.error('[InBody] Delete failed:', error);
    },
  });
}
