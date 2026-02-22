'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { WarningIcon, HouseIcon } from '@phosphor-icons/react';
import { RefreshIcon } from '@/components/ui/icons';
import Button from '@/components/ui/Button';
import { isApiError, getErrorMessageByCode, ApiErrorCode } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 폴백 UI 커스터마이징 */
  fallback?: ReactNode;
  /** 에러 발생 시 콜백 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 에러 리포팅 활성화 (프로덕션) */
  reportError?: boolean;
  /** 리셋 시 콜백 (React Query 연동 등) */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCode: ApiErrorCode | null;
}

// ============================================================================
// Error Boundary Component
// ============================================================================

/**
 * React Error Boundary
 *
 * 하위 컴포넌트에서 발생하는 에러를 캐치하여
 * 전체 앱 크래시를 방지하고 사용자 친화적 UI 표시
 *
 * @example
 * <ErrorBoundary onError={logError}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCode: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // ApiError인 경우 코드 추출
    const errorCode = isApiError(error) ? error.code : null;

    return {
      hasError: true,
      error,
      errorCode,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 에러 로깅
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // 커스텀 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);

    // 프로덕션에서 에러 리포팅 (Sentry 등 연동 시)
    if (this.props.reportError && process.env.NODE_ENV === 'production') {
      // TODO: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = (): void => {
    // React Query 에러 상태 리셋 (useQueryErrorResetBoundary 연동)
    this.props.onReset?.();

    this.setState({
      hasError: false,
      error: null,
      errorCode: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 커스텀 폴백이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorCode={this.state.errorCode}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Error Fallback UI
// ============================================================================

interface ErrorFallbackProps {
  error: Error | null;
  errorCode: ApiErrorCode | null;
  onReset: () => void;
  onGoHome: () => void;
}

function ErrorFallback({
  error,
  errorCode,
  onReset,
  onGoHome,
}: ErrorFallbackProps) {
  // 에러 코드에 따른 메시지
  const errorMessage = errorCode
    ? getErrorMessageByCode(errorCode)
    : '예상치 못한 오류가 발생했어요.';

  // 개발 환경에서만 상세 정보 표시
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        {/* 에러 아이콘 */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <WarningIcon size={40} className="text-destructive" />
        </div>

        {/* 제목 */}
        <h1 className="text-xl font-bold text-foreground">
          문제가 발생했어요
        </h1>

        {/* 메시지 */}
        <p className="mt-3 text-sm text-muted-foreground">
          {errorMessage}
        </p>

        {/* 개발 환경: 상세 에러 정보 */}
        {isDev && error && (
          <details className="mt-4 rounded-lg bg-muted/50 p-3 text-left">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              개발자 정보 (Dev Only)
            </summary>
            <pre className="mt-2 overflow-auto text-xs text-destructive">
              {error.name}: {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        {/* 액션 버튼들 */}
        <div className="mt-8 flex flex-col gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={onReset}
            className="w-full"
          >
            <RefreshIcon size="sm" />
            다시 시도
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onGoHome}
            className="w-full"
          >
            <HouseIcon size={16} />
            홈으로 이동
          </Button>
        </div>

        {/* 추가 안내 */}
        <p className="mt-6 text-xs text-muted-foreground">
          문제가 계속되면 앱을 재시작해 주세요.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default ErrorBoundary;
