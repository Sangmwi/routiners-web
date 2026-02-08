'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import { authApi } from '@/lib/api';

// React Query hooks

/**
 * Check if nickname is available
 */
export function useCheckNickname(nickname: string, enabled: boolean = true, excludeUserId?: string) {
  return useQuery({
    queryKey: queryKeys.user.checkNickname(nickname),
    queryFn: () => authApi.checkNickname(nickname, excludeUserId),
    enabled: enabled && nickname.length >= 2,
  });
}

/**
 * Complete signup mutation
 */
export function useCompleteSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.completeSignup,
    onSuccess: (data) => {
      // 캐시 업데이트
      queryClient.setQueryData(queryKeys.user.me(), data);
    },
  });
}

/**
 * Sign out mutation
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.fullSignOut,
    onSuccess: () => {
      queryClient.clear();

      // Notify app for WebView reset
      if (typeof window !== 'undefined' && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGOUT' }));
      }
    },
  });
}
