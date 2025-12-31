'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface TagProps {
  /** 태그 내용 */
  children: ReactNode;
  /** 좌측 아이콘 (LucideIcon 또는 ReactNode) */
  icon?: LucideIcon | ReactNode;
  /** 스타일 변형 */
  variant?: 'default' | 'muted' | 'outline';
  /** 크기 */
  size?: 'sm' | 'md';
  /** 비활성화 스타일 (값이 없을 때) */
  inactive?: boolean;
  /** 추가 클래스 */
  className?: string;
}

// ============================================================
// Component
// ============================================================

/**
 * 태그 공통 컴포넌트
 *
 * @example
 * // 기본 사용
 * <Tag icon={MapPin}>서울 강남구</Tag>
 *
 * // 아이콘 없이
 * <Tag>헬스</Tag>
 *
 * // muted 스타일 (배경색 다름)
 * <Tag variant="muted">웨이트</Tag>
 *
 * // 비활성화 (값이 없을 때)
 * <Tag icon={Ruler} inactive>미입력</Tag>
 */
export default function Tag({
  children,
  icon,
  variant = 'default',
  size = 'md',
  inactive = false,
  className = '',
}: TagProps) {
  // variant별 스타일
  const variantStyles = {
    default: 'bg-card border border-border/50',
    muted: 'bg-muted border-none',
    outline: 'bg-transparent border border-border',
  };

  // size별 스타일
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs gap-1.5',
  };

  // 아이콘 렌더링
  const renderIcon = () => {
    if (!icon) return null;

    const isLucideIcon = typeof icon === 'function';
    const iconSizeClass = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

    if (isLucideIcon) {
      const Icon = icon as LucideIcon;
      return <Icon className={`${iconSizeClass} text-muted-foreground flex-shrink-0`} />;
    }

    return (
      <span className={`${iconSizeClass} text-muted-foreground flex-shrink-0 [&>svg]:w-full [&>svg]:h-full`}>
        {icon}
      </span>
    );
  };

  return (
    <div
      className={`
        inline-flex items-center rounded-[14px]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${inactive ? 'text-muted-foreground' : 'text-card-foreground'}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {renderIcon()}
      <span>{children}</span>
    </div>
  );
}
