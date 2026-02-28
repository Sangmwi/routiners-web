'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigate } from '@/hooks/navigation';

interface AppLinkProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick'> {
  href: string;
  prefetch?: boolean;
  replace?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * App 내부에서 사용하는 버튼 기반 네비게이션 컴포넌트.
 * 이동 직전에 현재 라우트의 스크롤 상태를 저장한다 (useNavigate 내부 처리).
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
  const { push, replace: replaceRoute } = useNavigate();

  useEffect(() => {
    if (!prefetch) return;
    router.prefetch(href);
  }, [href, prefetch, router]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    replace ? replaceRoute(href) : push(href);
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
