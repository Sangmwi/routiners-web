'use client';

import { BackIcon } from '@/components/ui/icons';

interface HeaderShellProps {
  children: React.ReactNode;
  /** 배경 투명 (기본: false) */
  transparent?: boolean;
  /** sticky 여부 (기본: true) */
  sticky?: boolean;
  /** 메인 바 아래 추가 콘텐츠 (프로그레스 바 등) */
  below?: React.ReactNode;
  /** 추가 className */
  className?: string;
}

/**
 * 모든 페이지 헤더의 공통 셸
 *
 * - 일관된 bg, border, padding, z-index
 * - 내부 콘텐츠는 children으로 자유 구성
 */
export default function HeaderShell({
  children,
  transparent = false,
  sticky = true,
  below,
  className = '',
}: HeaderShellProps) {
  const bgClass = transparent
    ? 'bg-transparent'
    : 'bg-background border-b border-edge-subtle';

  const stickyClass = sticky ? 'sticky top-0 z-40' : '';

  return (
    <header className={`${stickyClass} ${bgClass} ${className}`}>
      <div className="flex items-center justify-between px-(--layout-padding-x) py-3">
        {children}
      </div>
      {below}
    </header>
  );
}

// ─── 공통 뒤로가기 버튼 ───

interface HeaderBackButtonProps {
  onClick: () => void;
  label?: string;
}

export function HeaderBackButton({ onClick, label = '뒤로가기' }: HeaderBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1 -ml-1 hover:bg-surface-muted rounded-lg transition-colors"
      aria-label={label}
    >
      <BackIcon size="lg" className="text-foreground" />
    </button>
  );
}
