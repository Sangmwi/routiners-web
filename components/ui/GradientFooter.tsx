import { type ReactNode } from 'react';

interface GradientFooterProps {
  children: ReactNode;
  /** 'page' = 페이지 하단 고정 바 (from-background), 'sheet' = 모달/드로어 풋터 (from-card) */
  variant?: 'page' | 'sheet';
  className?: string;
  /** page variant의 외부 fixed 컨테이너에 적용할 className (예: animate-float-up) */
  wrapperClassName?: string;
}

/**
 * 하단 액션 영역 래퍼 — border-t 대신 투명도 그라데이션으로 본문과 구분
 *
 * @example
 * // 페이지 하단 고정 바
 * <GradientFooter variant="page">
 *   <Button variant="primary" fullWidth>저장하기</Button>
 * </GradientFooter>
 *
 * // 시트/드로어 풋터
 * <GradientFooter variant="sheet">
 *   <Button variant="primary" fullWidth>확인</Button>
 * </GradientFooter>
 */
export default function GradientFooter({
  children,
  variant = 'page',
  className = '',
  wrapperClassName = '',
}: GradientFooterProps) {
  if (variant === 'page') {
    return (
      <div
        className={`fixed left-0 right-0 z-20 max-w-md mx-auto ${wrapperClassName}`}
        style={{ bottom: 'var(--safe-bottom)' }}
      >
        <div className="h-4 bg-gradient-to-t from-background to-transparent" />
        <div className={`px-4 pb-4 bg-background ${className}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative -mt-4">
      <div className="h-4 bg-gradient-to-t from-card to-transparent" />
      <div className={`px-4 pb-4 bg-card ${className}`}>
        {children}
      </div>
    </div>
  );
}
