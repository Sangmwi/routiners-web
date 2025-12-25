/**
 * WebView Constants (공유)
 *
 * 웹/앱에서 공통으로 사용하는 상수입니다.
 * 앱의 lib/webview/constants.ts에도 동일한 상수가 있어야 합니다.
 */

import type { RouteInfo } from './types';

// ============================================================================
// Route Constants
// ============================================================================

export const DEFAULT_ROUTE_INFO: RouteInfo = {
  path: '/',
  isTabRoute: true,
  isHome: true,
  canGoBack: false,
};

export const LOGIN_ROUTE_INFO: RouteInfo = {
  path: '/login',
  isTabRoute: false,
  isHome: false,
  canGoBack: false,
};
