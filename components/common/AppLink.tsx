'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AppLinkProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick'> {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * 앱 전용 네비게이션 컴포넌트
 *
 * - button 렌더링으로 Long-press 미리보기 방지
 * - SEO 불필요한 앱 내부 네비게이션용
 * - 이벤트 핸들러(onTouchStart 등)를 button에 전달
 * - onClick에서 e.preventDefault() 호출 시 네비게이션 차단
 *
 * Prefetch 전략:
 * - 탭 라우트(/,/routine,/community,/profile)는 useTabRoutePrefetch에서 중앙 관리
 * - 그 외 라우트(상세 페이지 등)는 개별 prefetch (마운트 시 1회)
 */
export default function AppLink({
  href,
  children,
  className = '',
  prefetch = true,
  replace = false,
  onClick,
  onMouseDown,
  ...rest
}: AppLinkProps) {
  const router = useRouter();

  // 비탭 라우트 단순 prefetch (마운트 시 1회)
  useEffect(() => {
    if (!prefetch) return;
    router.prefetch(href);
  }, [href, prefetch, router]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onMouseDown?.(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className={`select-none [-webkit-touch-callout:none] touch-manipulation ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
