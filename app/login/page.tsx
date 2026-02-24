"use client";

import { createClient } from "@/utils/supabase/client";
import { useState, useEffect, useRef } from "react";
import { LoadingSpinner } from "@/components/ui/icons";
import GoogleLogo from "@/assets/logos/google.svg";
import LogoFillRow from "@/assets/logos/brand/routiners-logo-fill-row.svg";
import LogoFillRowDark from "@/assets/logos/brand/routiners-logo-fill-row-dark.svg";
import { useWebViewAuth, useLoginCommands, useWebViewCore } from "@/hooks";

/**
 * 로그인 페이지
 *
 * 구조: Layout(배경) + Content가 동시에 렌더링 (Suspense 없음)
 * - 다른 페이지들과 동일한 패턴으로 즉시 렌더링
 * - 앱 스플래시 → 페이지 전환 시 깜빡임 방지
 * - PAGE_RENDERED를 이 페이지에서 직접 전송 (정확한 타이밍 보장)
 */
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const { requestLogin } = useWebViewAuth();
  const { isInWebView, sendMessage } = useWebViewCore();
  const hasRenderedRef = useRef(false);

  // WebView 환경: 로그인 관련 명령 처리
  useLoginCommands({
    onCancelled: () => setIsLoading(false),
    onError: (err) => {
      setIsLoading(false);
      setError(err);
    },
  });

  // URL에서 에러 파라미터 확인 (Suspense 없이 직접 처리)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, []);

  // 페이지 렌더링 완료 신호 전송 (이 페이지 컴포넌트 마운트 후)
  useEffect(() => {
    if (!isInWebView || hasRenderedRef.current) return;

    // Double RAF + 50ms 딜레이: blur 효과 등 GPU 연산이 완료된 후 전송
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          hasRenderedRef.current = true;
          sendMessage({ type: "PAGE_RENDERED" });
        }, 50);
      });
    });
  }, [isInWebView, sendMessage]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    // WebView 환경에서는 앱에 로그인 요청 전송 (네이티브 OAuth)
    // requestLogin()은 WebView가 아니면 false 반환
    const sentToApp = requestLogin();
    if (sentToApp) {
      console.log("[Login] Requested native OAuth from app");
      // 앱에서 OAuth 처리 후 토큰 전달받음
      // 로딩 상태 유지 (앱에서 처리 완료 후 페이지 이동됨)
      return;
    }

    // 웹 브라우저 환경에서는 기존 쿠키 기반 OAuth
    try {
      const isLocalhost = window.location.hostname === 'localhost' ||
                          window.location.hostname === '127.0.0.1' ||
                          window.location.hostname === '10.0.2.2';

      const redirectUrl = isLocalhost
        ? `${window.location.origin}/auth/callback`
        : 'https://routiners-web.vercel.app/auth/callback';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in with Google:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      {/* Background blur - 로고 위치에서 발산 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 h-[16rem] w-[16rem] rounded-full bg-surface-accent blur-3xl" />
      </div>

      {/* Logo - 화면 상단 ~40% 위치 */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 pt-4">
        <LogoFillRow className="h-12 w-auto dark:hidden" />
        <LogoFillRowDark className="hidden h-13 w-auto dark:block" />
        <p className="text-xs text-muted-foreground/90">
          군에서 시작되는 평생 루틴.
        </p>
      </div>

      {/* Bottom section - 로그인 버튼 + 푸터 */}
      <div className="relative z-10 w-full px-6 pb-12">
        <div className="mx-auto max-w-sm">
          {error && (
            <div className="mb-4 rounded-xl bg-surface-danger p-3 text-center text-sm text-destructive ring-1 ring-error">
              {error}
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-card px-6 py-4 text-sm font-medium text-card-foreground shadow-md ring-1 ring-border transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingSpinner size="md" />
            ) : (
              <>
                <GoogleLogo className="h-5 w-5" />
                <span>Google로 시작하기</span>
              </>
            )}
          </button>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground/60">
            © 2024 루티너스. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
