import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { createClient } from './server';

/**
 * 인증된 사용자 정보
 */
export interface AuthContext {
  /** Supabase Auth 사용자 */
  authUser: User;
  /** DB에 저장된 사용자 ID (users.id) */
  userId: string;
  /** Supabase 클라이언트 (재사용) */
  supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * 인증 에러 클래스
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * 현재 인증된 사용자 정보를 가져옵니다.
 *
 * 인증되지 않았거나 DB에 사용자가 없으면 null 반환
 *
 * @example
 * const auth = await getAuthUser();
 * if (!auth) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * const { authUser, userId, supabase } = auth;
 */
export async function getAuthUser(): Promise<AuthContext | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  // DB에서 사용자 ID 조회
  const { data: dbUser, error: dbError } = await supabase
    .from('users')
    .select('id')
    .eq('provider_id', authUser.id)
    .single();

  if (dbError || !dbUser) {
    return null;
  }

  return {
    authUser,
    userId: dbUser.id,
    supabase,
  };
}

/**
 * 인증이 필수인 경우 사용합니다.
 *
 * 인증되지 않으면 AuthError를 throw합니다.
 *
 * @throws {AuthError} 인증되지 않은 경우
 *
 * @example
 * try {
 *   const { authUser, userId, supabase } = await requireAuth();
 *   // 비즈니스 로직
 * } catch (error) {
 *   if (error instanceof AuthError) {
 *     return NextResponse.json({ error: error.message }, { status: error.statusCode });
 *   }
 *   throw error;
 * }
 */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await getAuthUser();

  if (!auth) {
    throw new AuthError('Unauthorized', 401);
  }

  return auth;
}

/**
 * 인증된 API 라우트 핸들러를 생성합니다.
 *
 * 인증 로직을 자동으로 처리하고, 인증된 사용자 정보를 핸들러에 전달합니다.
 *
 * @example
 * // app/api/user/me/route.ts
 * export const GET = withAuth(async (request, { authUser, userId, supabase }) => {
 *   const { data: user } = await supabase
 *     .from('users')
 *     .select('*')
 *     .eq('id', userId)
 *     .single();
 *
 *   return NextResponse.json(user);
 * });
 */
export function withAuth(
  handler: (
    request: NextRequest,
    auth: AuthContext
  ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      const auth = await requireAuth();
      return await handler(request, auth);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      console.error('[withAuth] Unexpected error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * 인증이 선택적인 API 라우트 핸들러를 생성합니다.
 *
 * 인증되지 않아도 핸들러가 실행되며, auth가 null일 수 있습니다.
 *
 * @example
 * export const GET = withOptionalAuth(async (request, auth) => {
 *   if (auth) {
 *     // 로그인한 사용자용 로직
 *   } else {
 *     // 비로그인 사용자용 로직
 *   }
 * });
 */
export function withOptionalAuth(
  handler: (
    request: NextRequest,
    auth: AuthContext | null
  ) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      const auth = await getAuthUser();
      return await handler(request, auth);
    } catch (error) {
      console.error('[withOptionalAuth] Unexpected error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
