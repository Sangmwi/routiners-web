'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InBodyRecord, InBodyUpdateData } from '@/lib/types';
import { inbodyApi } from '@/lib/api/inbody';
import { queryKeys } from '@/lib/constants/queryKeys';

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
      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.all,
      });

      // 최신 기록 캐시 업데이트
      queryClient.setQueryData(queryKeys.inbody.latest(), newRecord);

      // 요약 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.summary(),
      });
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
      // 상세 캐시 업데이트
      queryClient.setQueryData(
        queryKeys.inbody.detail(updatedRecord.id),
        updatedRecord
      );

      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.all,
      });

      // 최신 기록이면 캐시 업데이트
      const latestRecord = queryClient.getQueryData<InBodyRecord>(
        queryKeys.inbody.latest()
      );
      if (latestRecord?.id === updatedRecord.id) {
        queryClient.setQueryData(queryKeys.inbody.latest(), updatedRecord);
      }

      // 요약 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.summary(),
      });
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
      // 상세 캐시 제거
      queryClient.removeQueries({
        queryKey: queryKeys.inbody.detail(deletedId),
      });

      // 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.all,
      });

      // 최신 기록 캐시 무효화 (삭제된 것이 최신이었을 수 있음)
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.latest(),
      });

      // 요약 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.inbody.summary(),
      });
    },
  });
}
