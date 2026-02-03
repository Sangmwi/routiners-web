'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AppLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  replace?: boolean;
  onClick?: () => void;
}

/**
 * 앱 전용 네비게이션 컴포넌트
 *
 * - button 렌더링으로 Long-press 미리보기 방지
 * - SEO 불필요한 앱 내부 네비게이션용
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
}: AppLinkProps) {
  const router = useRouter();

  // 비탭 라우트 단순 prefetch (마운트 시 1회)
  useEffect(() => {
    if (!prefetch) return;
    router.prefetch(href);
  }, [href, prefetch, router]);

  const handleClick = () => {
    onClick?.();
    if (replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      className={`select-none [-webkit-touch-callout:none] touch-manipulation ${className}`}
    >
      {children}
    </button>
  );
}
