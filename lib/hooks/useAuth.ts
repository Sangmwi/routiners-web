'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { User, SignupCompleteData, ProfileUpdateData } from '@/lib/types';
import { queryKeys } from '@/lib/constants/queryKeys';

// API functions
const api = {
  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    const response = await fetch('/api/user/me', {
      credentials: 'include',
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  // Check nickname availability
  async checkNickname(nickname: string): Promise<{ available: boolean }> {
    const response = await fetch(`/api/user/check-nickname?nickname=${encodeURIComponent(nickname)}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to check nickname');
    return response.json();
  },

  // Complete signup (creates User)
  async completeSignup(data: SignupCompleteData): Promise<User> {
    console.log('[useAuth] Calling /api/signup/complete with data:', { ...data, phoneNumber: '***' });

    const response = await fetch('/api/signup/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    console.log('[useAuth] Response status:', response.status, response.statusText);
    console.log('[useAuth] Response headers:', Object.fromEntries(response.headers.entries()));

    // Check content type even for successful responses
    const contentType = response.headers.get('content-type');
    console.log('[useAuth] Content-Type:', contentType);

    if (!response.ok) {
      console.error('[useAuth] Error response content-type:', contentType);

      if (contentType?.includes('application/json')) {
        const error = await response.json();
        console.error('[useAuth] Error details:', error);
        const errorMessage = error.details || error.error || error.message || 'Failed to complete signup';
        throw new Error(errorMessage);
      } else {
        // If HTML error page, get text for debugging
        const text = await response.text();
        console.error('[useAuth] HTML error response:', text.substring(0, 200));
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    // Even if status is OK, check if we're actually getting JSON
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.error('[useAuth] Expected JSON but got:', contentType);
      console.error('[useAuth] Response body preview:', text.substring(0, 500));
      throw new Error('Server returned non-JSON response');
    }

    const result = await response.json();
    console.log('[useAuth] Successfully parsed response:', result);
    return result;
  },

  // Update user profile
  async updateProfile(data: ProfileUpdateData): Promise<User> {
    const response = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  // Sign out
  async signOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'local' });
  },
};

// React Query hooks

/**
 * Get current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: api.getCurrentUser,
  });
}

/**
 * Check if nickname is available
 */
export function useCheckNickname(nickname: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.user.checkNickname(nickname),
    queryFn: () => api.checkNickname(nickname),
    enabled: enabled && nickname.length >= 2,
  });
}

/**
 * Complete signup mutation
 */
export function useCompleteSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.completeSignup,
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
    mutationFn: api.signOut,
    onSuccess: () => {
      queryClient.clear();

      // Notify app for WebView reset
      if (typeof window !== 'undefined' && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGOUT' }));
      }
    },
  });
}
