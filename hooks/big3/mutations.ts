'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { big3Api } from '@/lib/api/big3';
import { queryKeys } from '@/lib/constants/queryKeys';
import type { Big3UpdateData } from '@/lib/types/big3';

/**
 * Big3 기록 생성 Mutation
 */
export function useCreateBig3() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: big3Api.createRecord,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.big3.all,
      });
      // progress 캐시도 무효화 (기존 홈/프로필/통계 소비자용)
      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.all,
      });
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
      queryClient.setQueryData(
        queryKeys.big3.detail(updatedRecord.id),
        updatedRecord,
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.big3.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.all,
      });
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
      queryClient.removeQueries({
        queryKey: queryKeys.big3.detail(deletedId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.big3.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.progress.all,
      });
    },
  });
}
