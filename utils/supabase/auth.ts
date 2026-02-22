import { NextRequest, NextResponse } from 'next/server';
import { User, createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from './server';

/**
 * 인증된 사용자 정보
 *
 * ⚠️ userId 제거됨 (RLS 기반 아키텍처)
 * - INSERT: DEFAULT current_user_id()가 자동 채움
 * - SELECT/UPDATE/DELETE: RLS가 자동 필터링
 * - users 테이블 조회 시: authUser.id (provider_id)로 직접 조회
 */
export interface AuthContext {
  /** Supabase Auth 사용자 */
  authUser: User;
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
  // 토큰 검증용 Supabase 클라이언트 (anon key + Bearer 토큰)
  // 이 클라이언트가 RLS 정책에서 auth.uid()를 올바르게 반환함
  const supabaseWithToken = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );

  // getSession(): JWT 로컬 파싱 (네트워크 없음)
  // - JWT 서명 검증 ✅
  // - 만료 시간 체크 ✅
  // - 만료 시 자동 refresh 시도 ✅
  const {
    data: { session },
    error: sessionError,
  } = await supabaseWithToken.auth.getSession();

  if (sessionError || !session?.user) {
    console.log('[Auth] Token verification failed:', sessionError?.message);
    return null;
  }

  // RLS가 current_user_id()로 자동 필터링하므로 DB 조회 불필요
  return {
    authUser: session.user,
    supabase: supabaseWithToken,
  };
}

/**
 * 쿠키 기반 인증을 수행합니다.
 * 웹 브라우저에서 직접 접근할 때 사용됩니다.
 */
async function getAuthUserFromCookie(): Promise<AuthContext | null> {
  const supabase = await createClient();

  // getSession(): JWT 로컬 파싱 (네트워크 없음)
  // - JWT 서명 검증 ✅
  // - 만료 시간 체크 ✅
  // - 만료 시 자동 refresh 시도 ✅
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return null;
  }

  // RLS가 current_user_id()로 자동 필터링하므로 DB 조회 불필요
  return {
    authUser: session.user,
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
 * 인증되지 않으면 null 반환
 *
 * @param request - NextRequest 객체 (토큰 인증 시 필요)
 *
 * @example
 * const auth = await getAuthUser(request);
 * if (!auth) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * const { authUser, supabase } = auth;
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
 *   const { authUser, supabase } = await requireAuth(request);
 *   // 비즈니스 로직 (RLS가 자동으로 user_id 필터링)
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
 * withAuth 핸들러에 전달되는 확장된 컨텍스트
 */
export interface AuthContextWithParams<P = Record<string, string>> extends AuthContext {
  /** Next.js 15+ 동적 라우트 params (Promise) */
  params: Promise<P>;
}

/**
 * 인증된 API 라우트 핸들러를 생성합니다. (하이브리드 방식)
 *
 * 인증 로직을 자동으로 처리하고, 인증된 사용자 정보를 핸들러에 전달합니다.
 * Authorization 헤더가 있으면 토큰 인증, 없으면 쿠키 인증을 사용합니다.
 *
 * @example
 * // 일반 JSON 응답 (RLS가 자동 필터링)
 * export const GET = withAuth(async (request, { authUser, supabase }) => {
 *   const { data } = await supabase
 *     .from('routine_events')
 *     .select('*');
 *   // RLS가 current_user_id()로 자동 필터링
 *   return NextResponse.json(data);
 * });
 *
 * // users 테이블 조회 시 provider_id 사용
 * export const GET = withAuth(async (request, { authUser, supabase }) => {
 *   const { data: user } = await supabase
 *     .from('users')
 *     .select('*')
 *     .eq('provider_id', authUser.id)
 *     .single();
 *   return NextResponse.json(user);
 * });
 *
 * // 동적 라우트 params 사용
 * export const GET = withAuth(async (request, { supabase, params }) => {
 *   const { id } = await params;
 *   // ...
 * });
 *
 * // SSE 스트리밍 응답
 * export const POST = withAuth(async (request, { supabase }) => {
 *   const stream = new ReadableStream({ ... });
 *   return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
 * });
 */
export function withAuth<T extends Response = NextResponse, P = Record<string, string>>(
  handler: (
    request: NextRequest,
    auth: AuthContextWithParams<P>
  ) => Promise<T>
): (request: NextRequest, context: { params: Promise<P> }) => Promise<T | NextResponse> {
  return async (request: NextRequest, context: { params: Promise<P> }) => {
    try {
      const auth = await requireAuth(request);
      const authWithParams: AuthContextWithParams<P> = {
        ...auth,
        params: context.params,
      };
      return await handler(request, authWithParams);
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
