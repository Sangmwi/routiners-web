'use client';

import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';

export function invalidatePostCaches(queryClient: QueryClient, postId?: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.post.lists() });
  if (postId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.post.detail(postId) });
  }
}

export function invalidateCommentCaches(queryClient: QueryClient, postId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.post.comments(postId) });
  invalidatePostCaches(queryClient, postId);
}
