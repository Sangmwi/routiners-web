import { NextRequest, NextResponse } from 'next/server';
import { User, createClient as createSupabaseClient } from '@supabase/supabase-js';
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

// ============================================================================
// 하이브리드 인증: Bearer 토큰 + 쿠키 지원
// ============================================================================

/**
 * Authorization 헤더에서 Bearer 토큰을 추출합니다.
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

/**
 * Bearer 토큰으로 사용자 인증을 수행합니다.
 * Expo 앱에서 토큰을 직접 전달할 때 사용됩니다.
 */
async function getAuthUserFromToken(accessToken: string): Promise<AuthContext | null> {
  // 토큰 검증용 Supabase 클라이언트 (서버 키 불필요, anon key로 충분)
  const supabaseWithToken = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseWithToken.auth.getUser();

  if (authError || !authUser) {
    console.log('[Auth] Token verification failed:', authError?.message);
    return null;
  }

  // DB에서 사용자 ID 조회 (토큰 인증된 클라이언트 사용)
  const { data: dbUser, error: dbError } = await supabaseWithToken
    .from('users')
    .select('id')
    .eq('provider_id', authUser.id)
    .single();

  if (dbError || !dbUser) {
    return null;
  }

  // 쿠키 기반 클라이언트도 생성 (DB 쿼리용으로 재사용)
  const supabase = await createClient();

  return {
    authUser,
    userId: dbUser.id,
    supabase,
  };
}

/**
 * 쿠키 기반 인증을 수행합니다.
 * 웹 브라우저에서 직접 접근할 때 사용됩니다.
 */
async function getAuthUserFromCookie(): Promise<AuthContext | null> {
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
 * 현재 인증된 사용자 정보를 가져옵니다. (하이브리드 방식)
 *
 * 인증 우선순위:
 * 1. Authorization 헤더의 Bearer 토큰 (Expo 앱)
 * 2. 쿠키 기반 세션 (웹 브라우저)
 *
 * 인증되지 않았거나 DB에 사용자가 없으면 null 반환
 *
 * @param request - NextRequest 객체 (토큰 인증 시 필요)
 *
 * @example
 * const auth = await getAuthUser(request);
 * if (!auth) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * const { authUser, userId, supabase } = auth;
 */
export async function getAuthUser(request?: NextRequest): Promise<AuthContext | null> {
  // 1. Authorization 헤더 체크 (Expo 앱에서 오는 요청)
  if (request) {
    const token = extractBearerToken(request);
    if (token) {
      const authFromToken = await getAuthUserFromToken(token);
      if (authFromToken) {
        return authFromToken;
      }
      // 토큰이 있지만 검증 실패 → 쿠키로 폴백하지 않고 null 반환
      // (토큰을 보냈다는 건 앱에서 온 요청이므로 쿠키가 없을 가능성 높음)
      console.log('[Auth] Token provided but invalid, not falling back to cookie');
      return null;
    }
  }

  // 2. 쿠키 방식 (웹 브라우저)
  return await getAuthUserFromCookie();
}

/**
 * 인증이 필수인 경우 사용합니다.
 *
 * 인증되지 않으면 AuthError를 throw합니다.
 *
 * @param request - NextRequest 객체 (토큰 인증 시 필요)
 * @throws {AuthError} 인증되지 않은 경우
 *
 * @example
 * try {
 *   const { authUser, userId, supabase } = await requireAuth(request);
 *   // 비즈니스 로직
 * } catch (error) {
 *   if (error instanceof AuthError) {
 *     return NextResponse.json({ error: error.message }, { status: error.statusCode });
 *   }
 *   throw error;
 * }
 */
export async function requireAuth(request?: NextRequest): Promise<AuthContext> {
  const auth = await getAuthUser(request);

  if (!auth) {
    throw new AuthError('Unauthorized', 401);
  }

  return auth;
}

/**
 * 인증된 API 라우트 핸들러를 생성합니다. (하이브리드 방식)
 *
 * 인증 로직을 자동으로 처리하고, 인증된 사용자 정보를 핸들러에 전달합니다.
 * Authorization 헤더가 있으면 토큰 인증, 없으면 쿠키 인증을 사용합니다.
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
      const auth = await requireAuth(request);
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
 * 인증이 선택적인 API 라우트 핸들러를 생성합니다. (하이브리드 방식)
 *
 * 인증되지 않아도 핸들러가 실행되며, auth가 null일 수 있습니다.
 * Authorization 헤더가 있으면 토큰 인증, 없으면 쿠키 인증을 사용합니다.
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
      const auth = await getAuthUser(request);
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
