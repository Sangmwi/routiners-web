/**
 * 인증이 필요한 API 호출을 위한 Fetch 래퍼 (하이브리드 인증 지원)
 *
 * 인증 방식:
 * 1. Expo 앱 (WebView): 주입된 토큰으로 Authorization 헤더 사용
 * 2. 웹 브라우저: 쿠키 기반 인증 (기존 방식)
 *
 * 401 에러 발생 시:
 * - 앱 환경: 앱에 토큰 갱신 요청 (REQUEST_TOKEN_REFRESH)
 * - 웹 환경: Supabase 세션 갱신 시도
 */

import { createClient } from '@/utils/supabase/client';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'app_access_token';
const LOG_PREFIX = '[authFetch]';

// ============================================================================
// Token Storage (sessionStorage 기반 - 페이지 리로드에도 유지)
// ============================================================================

/**
 * 메모리 캐시 (성능 최적화)
 * sessionStorage 접근을 최소화하기 위한 in-memory 캐시
 */
let _tokenCache: string | null = null;
let _isInitialized = false;

/**
 * sessionStorage에서 토큰을 복원합니다.
 * 모듈 로드 시 자동 실행됩니다.
 */
function initializeToken(): void {
  if (_isInitialized || typeof window === 'undefined') return;

  try {
    _tokenCache = sessionStorage.getItem(STORAGE_KEY);
    _isInitialized = true;

    if (_tokenCache) {
      console.log(`${LOG_PREFIX} Token restored from sessionStorage`);
    }
  } catch (e) {
    console.error(`${LOG_PREFIX} Failed to restore token:`, e);
  }
}

// 클라이언트 사이드에서 즉시 초기화
if (typeof window !== 'undefined') {
  initializeToken();
}

/**
 * Expo 앱에서 주입된 토큰을 설정합니다.
 * WebViewBridge에서 앱으로부터 토큰을 받으면 호출됩니다.
 *
 * @param token - Access token (null이면 토큰 제거)
 */
export function setAuthToken(token: string | null): void {
  _tokenCache = token;

  if (typeof window !== 'undefined') {
    try {
      if (token) {
        sessionStorage.setItem(STORAGE_KEY, token);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error(`${LOG_PREFIX} Failed to persist token:`, e);
    }
  }

  console.log(`${LOG_PREFIX} Token ${token ? 'set' : 'cleared'}`);
}

/**
 * 현재 저장된 토큰을 반환합니다.
 */
export function getAuthToken(): string | null {
  // 초기화되지 않았으면 초기화 시도
  if (!_isInitialized) {
    initializeToken();
  }
  return _tokenCache;
}

/**
 * 토큰이 설정되어 있는지 확인합니다. (앱 환경인지 확인용)
 */
export function hasAuthToken(): boolean {
  return getAuthToken() !== null;
}

/**
 * WebView 환경인지 확인합니다.
 */
export function isInWebView(): boolean {
  return typeof window !== 'undefined' && !!window.ReactNativeWebView;
}

// ============================================================================
// Types
// ============================================================================

interface AuthFetchOptions extends RequestInit {
  /** 401 에러 시 세션 갱신 후 재시도 여부 (기본: true) */
  refreshOnUnauthorized?: boolean;
  /** 최대 재시도 횟수 (기본: 1) */
  maxRetries?: number;
}

// ============================================================================
// Session Refresh (환경별 분기)
// ============================================================================

/**
 * 앱에 토큰 갱신을 요청합니다.
 * Promise를 반환하여 갱신 완료를 대기할 수 있습니다.
 */
function requestTokenRefreshFromApp(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!window.ReactNativeWebView) {
      resolve(false);
      return;
    }

    // 타임아웃 설정 (5초)
    const timeout = setTimeout(() => {
      window.removeEventListener('app-command', handleTokenUpdate);
      console.log(`${LOG_PREFIX} Token refresh timeout`);
      resolve(false);
    }, 5000);

    // 토큰 업데이트 이벤트 대기
    const handleTokenUpdate = (event: CustomEvent) => {
      if (event.detail?.type === 'SET_TOKEN' && event.detail.token) {
        clearTimeout(timeout);
        window.removeEventListener('app-command', handleTokenUpdate);
        setAuthToken(event.detail.token);
        console.log(`${LOG_PREFIX} Token refreshed from app`);
        resolve(true);
      }
    };

    window.addEventListener('app-command', handleTokenUpdate as EventListener);

    // 앱에 갱신 요청
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'REQUEST_TOKEN_REFRESH' })
    );

    console.log(`${LOG_PREFIX} Requested token refresh from app`);
  });
}

/**
 * 쿠키 기반 세션 갱신 시도 (웹 브라우저 환경)
 */
async function tryRefreshCookieSession(): Promise<boolean> {
  const supabase = createClient();

  console.log(`${LOG_PREFIX} Attempting cookie session refresh...`);

  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error(`${LOG_PREFIX} Cookie session refresh failed:`, error.message);
      return false;
    }

    if (!data.session) {
      console.error(`${LOG_PREFIX} No session after refresh`);
      return false;
    }

    console.log(`${LOG_PREFIX} Cookie session refreshed, expires:`, data.session.expires_at);
    return true;
  } catch (e) {
    console.error(`${LOG_PREFIX} Cookie session refresh error:`, e);
    return false;
  }
}

/**
 * 환경에 맞는 세션 갱신을 시도합니다.
 */
async function tryRefreshSession(): Promise<boolean> {
  // WebView 환경: 앱에 토큰 갱신 요청
  if (isInWebView() && hasAuthToken()) {
    return requestTokenRefreshFromApp();
  }

  // 웹 브라우저 환경: 쿠키 기반 세션 갱신
  return tryRefreshCookieSession();
}

// ============================================================================
// Logout Handler
// ============================================================================

/**
 * 로그아웃 처리 (세션 갱신 실패 시)
 */
async function handleLogout(): Promise<void> {
  console.log(`${LOG_PREFIX} Logging out due to session refresh failure`);

  // 토큰 제거
  setAuthToken(null);

  // 쿠키 세션도 정리
  try {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'local' });
  } catch (e) {
    console.error(`${LOG_PREFIX} Supabase signOut error:`, e);
  }

  // WebView 앱에 로그아웃 알림
  if (isInWebView()) {
    window.ReactNativeWebView!.postMessage(JSON.stringify({ type: 'LOGOUT' }));
  }

  // 로그인 페이지로 이동
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

// ============================================================================
// Main Fetch Function
// ============================================================================

/**
 * 인증이 필요한 API 호출용 fetch 래퍼
 *
 * - 앱 환경: Authorization 헤더로 토큰 전달
 * - 웹 환경: 쿠키 기반 인증
 * - 401 에러 시 자동으로 세션 갱신 후 재시도
 *
 * @example
 * ```ts
 * const response = await authFetch('/api/user/me');
 *
 * const response = await authFetch('/api/user/profile', {
 *   method: 'PATCH',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export async function authFetch(
  url: string,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const {
    refreshOnUnauthorized = true,
    maxRetries = 1,
    ...fetchOptions
  } = options;

  // 헤더 구성
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  // 토큰이 있으면 Authorization 헤더 추가
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const mergedOptions: RequestInit = {
    credentials: 'include', // 쿠키도 함께 전송 (웹 환경 지원)
    ...fetchOptions,
    headers,
  };

  let lastResponse: Response | null = null;
  let retryCount = 0;

  console.log(`${LOG_PREFIX} 📤 ${fetchOptions.method || 'GET'} ${url}`);

  while (retryCount <= maxRetries) {
    try {
      const response = await fetch(url, mergedOptions);
      lastResponse = response;

      console.log(`${LOG_PREFIX} 📥 ${response.status} ${url}`);

      // 성공 또는 401 외의 에러
      if (response.status !== 401) {
        return response;
      }

      // 401 && 세션 갱신 비활성화
      if (!refreshOnUnauthorized) {
        console.log(`${LOG_PREFIX} 401, refresh disabled`);
        return response;
      }

      // 401 && 재시도 횟수 초과
      if (retryCount >= maxRetries) {
        console.log(`${LOG_PREFIX} 401, max retries exceeded`);
        break;
      }

      console.log(`${LOG_PREFIX} 401, attempting refresh (${retryCount + 1}/${maxRetries})`);

      // 세션 갱신 시도
      const refreshed = await tryRefreshSession();

      if (!refreshed) {
        console.log(`${LOG_PREFIX} Refresh failed, logging out`);
        await handleLogout();
        return response;
      }

      // 갱신 성공 - 새 토큰으로 헤더 업데이트
      const newToken = getAuthToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        mergedOptions.headers = headers;
      }

      retryCount++;
    } catch (networkError) {
      console.error(`${LOG_PREFIX} 🔴 Network error:`, networkError);
      throw networkError;
    }
  }

  // 모든 재시도 실패 시 로그아웃
  if (lastResponse?.status === 401) {
    await handleLogout();
  }

  return lastResponse!;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * JSON 응답을 처리하는 authFetch 헬퍼
 *
 * @example
 * ```ts
 * const user = await authFetchJson<User>('/api/user/me');
 * ```
 */
export async function authFetchJson<T>(
  url: string,
  options: AuthFetchOptions = {}
): Promise<T> {
  const response = await authFetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}
