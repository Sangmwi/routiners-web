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
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('id')
        .eq('provider_id', user.id)
        .maybeSingle()

      const userExistsInDb = !!dbUser && !error

      // 기존 유저 → 로그인/회원가입 페이지 접근 시 홈으로
      if (userExistsInDb && AUTH_CHECK_ROUTES.has(pathname)) {
        return redirectTo(request, '/')
      }

      // 신규 유저 (DB에 없음) → 회원가입으로
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
