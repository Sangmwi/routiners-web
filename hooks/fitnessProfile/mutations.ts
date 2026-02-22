'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fitnessProfileApi } from '@/lib/api/fitnessProfile';
import { FitnessProfileUpdateData } from '@/lib/types/fitness';
import { queryKeys } from '@/lib/constants/queryKeys';

/**
 * 피트니스 프로필 업데이트 mutation (PATCH)
 */
export function useUpdateFitnessProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FitnessProfileUpdateData) =>
      fitnessProfileApi.updateFitnessProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(queryKeys.fitnessProfile.me(), updatedProfile);
    },
  });
}

/**
 * 피트니스 프로필 전체 교체 mutation (PUT)
 */
export function useReplaceFitnessProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FitnessProfileUpdateData) =>
      fitnessProfileApi.replaceFitnessProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(queryKeys.fitnessProfile.me(), updatedProfile);
    },
  });
}

/**
 * 피트니스 프로필 삭제 mutation
 */
export function useDeleteFitnessProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fitnessProfileApi.deleteFitnessProfile(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fitnessProfile.all });
    },
  });
}
