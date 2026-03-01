import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';

/**
 * 피트니스 프로필 관련 쿼리 캐시 무효화
 */
export function invalidateFitnessProfileCaches(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.fitnessProfile.all });
}
