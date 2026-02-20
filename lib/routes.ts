// ============================================================================
// Route Configuration
// ============================================================================

/** 메인 탭 경로 */
export const TAB_ROUTES = ['/', '/routine', '/community', '/profile'] as const;

/** 하단 탭을 숨길 경로 패턴 (정확히 일치하거나 prefix로 시작) */
export const ROUTES_WITHOUT_TAB = [
  '/login',           // 로그인 페이지
  '/signup',          // 회원가입 페이지
  '/onboarding',      // 온보딩 페이지
  '/app-init',        // 앱 초기화 페이지 (WebView 세션 동기화)
  // 하위 페이지들 (prefix 매칭)
  '/routine/',        // /routine/counselor, /routine/2025-01-01 등
  '/community/',      // /community/post/123 등
  '/profile/edit',
  '/profile/inbody',  // 인바디 관리
  '/profile/fitness', // 피트니스 관리
] as const;

// ============================================================================
// Utilities
// ============================================================================

export type TabRoute = (typeof TAB_ROUTES)[number];

export const isTabRoute = (path: string): path is TabRoute =>
  TAB_ROUTES.includes(path as TabRoute);

/** 현재 경로에서 하단 탭을 보여줄지 결정 */
export const shouldShowBottomTab = (pathname: string): boolean => {
  // 정확히 일치하거나 prefix로 시작하는 경로면 탭 숨김
  return !ROUTES_WITHOUT_TAB.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
};

