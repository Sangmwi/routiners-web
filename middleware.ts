import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ============================================================================
// Route Configuration
// ============================================================================

/** 인증 불필요 경로 (exact match) */
const PUBLIC_ROUTES = new Set(['/login', '/app-init'])

/** 인증 불필요 경로 (prefix match) */
const PUBLIC_PREFIXES = ['/auth/']

/** 회원가입 경로 (인증 필요, DB 유저 불필요) */
const SIGNUP_PREFIX = '/signup'

/** 인증 관련 경로 (DB 체크 필요) */
const AUTH_CHECK_ROUTES = new Set(['/login', '/signup'])

// ============================================================================
// User Exists Cache Configuration
// ============================================================================

/** 유저 존재 캐시 쿠키명 */
const USER_EXISTS_COOKIE = 'routiners_user_verified'

/** 캐시 유효기간 (24시간) */
const USER_EXISTS_TTL = 60 * 60 * 24

// ============================================================================
// Helpers
// ============================================================================

const isPublicRoute = (pathname: string): boolean =>
  PUBLIC_ROUTES.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))

const isSignupRoute = (pathname: string): boolean =>
  pathname.startsWith(SIGNUP_PREFIX)

/** 리다이렉트 헬퍼 */
const redirectTo = (request: NextRequest, path: string) => {
  const url = request.nextUrl.clone()
  url.pathname = path
  return NextResponse.redirect(url)
}

// ============================================================================
// User Exists Cache Helpers
// ============================================================================

/**
 * 유저 존재 여부 캐시 확인
 * 쿠키 값이 user.id와 일치하면 캐시 유효
 * 형식: {userId}:{timestamp}
 */
const getUserExistsCache = (request: NextRequest, userId: string): boolean => {
  const cached = request.cookies.get(USER_EXISTS_COOKIE)?.value
  if (!cached) return false

  const [cachedUserId, timestampStr] = cached.split(':')
  if (cachedUserId !== userId) return false

  const timestamp = parseInt(timestampStr, 10)
  if (isNaN(timestamp)) return false

  const now = Math.floor(Date.now() / 1000)
  if (now - timestamp > USER_EXISTS_TTL) return false

  return true
}

/**
 * 유저 존재 여부 캐시 설정
 */
const setUserExistsCache = (response: NextResponse, userId: string): void => {
  const timestamp = Math.floor(Date.now() / 1000)
  response.cookies.set(USER_EXISTS_COOKIE, `${userId}:${timestamp}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: USER_EXISTS_TTL,
    path: '/',
  })
}

// ============================================================================
// Middleware
// ============================================================================

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublic = isPublicRoute(pathname)
  const isSignup = isSignupRoute(pathname)

  // 미인증 사용자 → 보호된 경로 접근 시 로그인으로
  if (!user && !isPublic) {
    return redirectTo(request, '/login')
  }

  // 인증된 사용자 → DB 유저 존재 여부 확인
  if (user) {
    const needsDbCheck = AUTH_CHECK_ROUTES.has(pathname) || (!isPublic && !isSignup)

    if (needsDbCheck) {
      // 1. 캐시 확인 (DB 조회 스킵)
      const isCached = getUserExistsCache(request, user.id)

      if (isCached) {
        // 캐시된 유저 → 로그인/회원가입 페이지 접근 시 홈으로
        if (AUTH_CHECK_ROUTES.has(pathname)) {
          return redirectTo(request, '/')
        }
        return supabaseResponse
      }

      // 2. 캐시 없음 → DB 조회
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('id')
        .eq('provider_id', user.id)
        .maybeSingle()

      const userExistsInDb = !!dbUser && !error

      // 3. 기존 유저 → 캐시 설정 + 리다이렉트 처리
      if (userExistsInDb) {
        setUserExistsCache(supabaseResponse, user.id)

        if (AUTH_CHECK_ROUTES.has(pathname)) {
          return redirectTo(request, '/')
        }
      }

      // 4. 신규 유저 (DB에 없음) → 회원가입으로
      if (!userExistsInDb && !isSignup) {
        return redirectTo(request, '/signup')
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     * - api routes (API endpoints)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
