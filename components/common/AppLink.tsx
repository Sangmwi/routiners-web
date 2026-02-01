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
 * - router.prefetch()로 프리페칭
 * - button 렌더링으로 Long-press 미리보기 방지
 * - SEO 불필요한 앱 내부 네비게이션용
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

  useEffect(() => {
    if (prefetch) {
      router.prefetch(href);
    }
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
