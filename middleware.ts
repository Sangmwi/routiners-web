import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
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

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/auth/callback']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Signup route (requires auth session but not User record)
  const isSignupRoute = pathname.startsWith('/signup')

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Only check DB user status when necessary (login/signup pages or first access)
  // This reduces DB queries on every route navigation
  if (user) {
    const needsDbCheck =
      pathname === '/login' ||
      pathname === '/signup' ||
      (!isPublicRoute && !isSignupRoute);

    if (needsDbCheck) {
      // Single DB query for all scenarios
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('id')
        .eq('provider_id', user.id)
        .maybeSingle()

      const userExistsInDb = !!dbUser && !error;

      // Scenario 1: User exists, trying to access login/signup -> redirect home
      if (userExistsInDb && (pathname === '/login' || pathname === '/signup')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }

      // Scenario 2: User doesn't exist, trying to access protected route -> redirect signup
      if (!userExistsInDb && !isPublicRoute && !isSignupRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/signup'
        return NextResponse.redirect(url)
      }

      // Scenario 3: User doesn't exist, on login page -> redirect signup
      if (!userExistsInDb && pathname === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/signup'
        return NextResponse.redirect(url)
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
