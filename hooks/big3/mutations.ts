'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { big3Api } from '@/lib/api/big3';
import { queryKeys } from '@/lib/constants/queryKeys';
import type { Big3UpdateData } from '@/lib/types/big3';
import { invalidateBig3Caches } from './cacheHelpers';

/**
 * Big3 기록 생성 Mutation
 */
export function useCreateBig3() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: big3Api.createRecord,

    onSuccess: () => {
      invalidateBig3Caches(queryClient);
    },
  });
}

/**
 * Big3 기록 수정 Mutation
 */
export function useUpdateBig3() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Big3UpdateData }) =>
      big3Api.updateRecord(id, data),

    onSuccess: (updatedRecord) => {
      queryClient.setQueryData(queryKeys.big3.detail(updatedRecord.id), updatedRecord);
      invalidateBig3Caches(queryClient);
    },
  });
}

/**
 * Big3 기록 삭제 Mutation
 */
export function useDeleteBig3() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: big3Api.deleteRecord,

    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: queryKeys.big3.detail(deletedId) });
      invalidateBig3Caches(queryClient);
    },
  });
}
