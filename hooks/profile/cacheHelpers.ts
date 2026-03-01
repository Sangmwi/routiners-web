import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';

/**
 * 프로필 관련 쿼리 캐시 무효화
 */
export function invalidateProfileCaches(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
  queryClient.invalidateQueries({ queryKey: queryKeys.user.search(), exact: false });
}
