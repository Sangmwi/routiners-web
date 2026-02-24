/**
 * Auth API Layer
 *
 * 인증 관련 API 함수들
 * React Query에 의존하지 않음 - 재사용성과 테스트 용이성 향상
 *
 * @throws {ApiError} 모든 API 에러는 ApiError로 통일
 */

import { User, SignupCompleteData, ApiError } from '@/lib/types';
import { authFetch } from '@/lib/utils/authFetch';
import { createClient } from '@/utils/supabase/client';
import { api } from './client';
import { parseApiResponse } from '@/lib/schemas/api.schema';
import { UserSchema } from '@/lib/schemas/user.schema';

export const authApi = {
  /**
   * 닉네임 사용 가능 여부 확인
   *
   * @param nickname - 확인할 닉네임
   * @returns 사용 가능 여부
   * @throws {ApiError} 확인 실패 시
   */
  async checkNickname(nickname: string, excludeUserId?: string): Promise<{ available: boolean }> {
    const params = new URLSearchParams({ nickname });
    if (excludeUserId) params.set('excludeUserId', excludeUserId);
    return api.getOrThrow<{ available: boolean }>(
      `/api/user/check-nickname?${params.toString()}`
    );
  },

  /**
   * 회원가입 완료 (User 레코드 생성)
   *
   * @param data - 회원가입 데이터
   * @returns 생성된 User 객체
   * @throws {ApiError} 가입 실패 시
   */
  async completeSignup(data: Omit<SignupCompleteData, 'providerId' | 'email'>): Promise<User> {
    // 특수 에러 처리가 필요하여 authFetch 직접 사용
    const response = await authFetch('/api/signup/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      if (contentType?.includes('application/json')) {
        throw await ApiError.fromResponse(response);
      } else {
        throw new ApiError(
          `Server error: ${response.status} ${response.statusText}`,
          response.status,
          'INTERNAL_ERROR'
        );
      }
    }

    if (!contentType?.includes('application/json')) {
      throw new ApiError('Server returned non-JSON response', 500, 'INTERNAL_ERROR');
    }

    return parseApiResponse(response, UserSchema);
  },

  /**
   * 로그아웃
   *
   * Supabase 세션 종료 (로컬만)
   */
  async signOut(): Promise<void> {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'local' });
  },

  /**
   * 서버 세션 삭제
   *
   * httpOnly 쿠키 삭제를 위해 서버 API 호출
   */
  async deleteServerSession(): Promise<void> {
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
    });
  },

  /**
   * 전체 로그아웃 (클라이언트 + 서버)
   */
  async fullSignOut(): Promise<void> {
    await Promise.all([
      authApi.signOut(),
      authApi.deleteServerSession(),
    ]);
  },
};
