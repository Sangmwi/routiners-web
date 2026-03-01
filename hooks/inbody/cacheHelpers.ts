'use client';

import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';

export function invalidateInBodyCaches(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.inbody.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.inbody.summary() });
}
