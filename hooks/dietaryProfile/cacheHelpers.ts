import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';

/**
 * 식단 프로필 관련 쿼리 캐시 무효화
 */
export function invalidateDietaryProfileCaches(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.dietaryProfile.all });
}
