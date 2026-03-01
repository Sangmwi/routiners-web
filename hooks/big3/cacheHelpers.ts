'use client';

import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';

export function invalidateBig3Caches(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.big3.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
}
