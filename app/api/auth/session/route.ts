/**
 * 세션 관리 API (레거시)
 *
 * ⚠️ WebView에서는 사용하지 않음!
 * WebView는 클라이언트 사이드 supabase.auth.setSession()을 사용합니다.
 * (hooks/webview/useWebViewAuth.ts 참조)
 *
 * 이 API는 웹 브라우저에서 직접 OAuth 로그인할 때만 사용됩니다.
 *
 * POST: 토큰으로 쿠키 세션 설정
 * DELETE: 세션 삭제 (로그아웃)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// ============================================================================
// POST /api/auth/session - 토큰으로 쿠키 세션 설정
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { access_token, refresh_token } = body;

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'access_token and refresh_token are required' },
        { status: 400 }
      );
    }

    // Response 객체 생성 (쿠키 설정용)
    let response = NextResponse.json({ success: true });

    // 설정할 쿠키 수집
    const cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }> = [];

    // Supabase 클라이언트 생성
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach((cookie) => {
              cookiesToSet.push(cookie);
            });
          },
        },
      }
    );

    // 토큰으로 세션 설정
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error('[API] Session set failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid tokens', details: error.message },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Response에 쿠키 설정
    response = NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      expires_at: data.session.expires_at,
    });

    // 수집된 쿠키를 Response에 적용
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, {
        ...options,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    });

    console.log('[API] Session set for:', data.user?.email, 'cookies:', cookiesToSet.length);

    return response;
  } catch (error) {
    console.error('[API] Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/auth/session - 세션 삭제 (로그아웃)
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            cookies.forEach((cookie) => {
              cookiesToSet.push(cookie);
            });
          },
        },
      }
    );

    await supabase.auth.signOut();

    // Response 생성
    const response = NextResponse.json({ success: true });

    // Supabase가 설정한 쿠키 (빈 값으로 삭제) 적용
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    // 추가로 Supabase 관련 쿠키 명시적 삭제
    const allCookies = request.cookies.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
        response.cookies.delete(cookie.name);
      }
    }

    console.log('[API] Session cleared');

    return response;
  } catch (error) {
    console.error('[API] Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
