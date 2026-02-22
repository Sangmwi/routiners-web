'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dietaryProfileApi } from '@/lib/api/dietaryProfile';
import { DietaryProfileUpdateData } from '@/lib/types/meal';
import { queryKeys } from '@/lib/constants/queryKeys';

/**
 * 식단 프로필 업데이트 mutation
 */
export function useUpdateDietaryProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DietaryProfileUpdateData) =>
      dietaryProfileApi.updateDietaryProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(queryKeys.dietaryProfile.me(), updatedProfile);
    },
  });
}
