'use client';

import { ReactNode } from 'react';
import ViewMoreButton from './ViewMoreButton';

// ============================================================
// Types
// ============================================================

interface SectionHeaderAction {
  /** 버튼 라벨 */
  label: string;
  /** 클릭 핸들러 (href가 없을 때 사용) */
  onClick?: () => void;
  /** 링크 URL (onClick 대신 사용) */
  href?: string;
  /** 아이콘 숨기기 */
  hideIcon?: boolean;
}

interface SectionHeaderProps {
  /** 섹션 제목 */
  title: string;
  /** 부제목/설명 */
  description?: string;
  /** 우측 액션 버튼 */
  action?: SectionHeaderAction;
  /** 배지 (개수, 상태 등) */
  badge?: number | string;
  /** 제목 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 클래스 */
  className?: string;
  /** 커스텀 우측 영역 (action 대신 사용) */
  rightSlot?: ReactNode;
}

// ============================================================
// Component
// ============================================================

/**
 * 섹션 헤더 공통 컴포넌트
 *
 * @example
 * // 기본 사용
 * <SectionHeader title="인바디 정보" />
 *
 * // 액션 버튼
 * <SectionHeader
 *   title="운동 장소"
 *   action={{ label: "더보기", href: "/locations" }}
 * />
 *
 * // 배지와 함께
 * <SectionHeader
 *   title="측정 기록"
 *   badge={5}
 *   action={{ label: "전체보기", onClick: handleClick }}
 * />
 *
 * // 설명 포함
 * <SectionHeader
 *   title="프로필 사진"
 *   description="최대 4장까지 등록할 수 있어요"
 *   size="md"
 * />
 */
export default function SectionHeader({
  title,
  description,
  action,
  badge,
  size = 'lg',
  className = '',
  rightSlot,
}: SectionHeaderProps) {
  // 사이즈별 스타일
  const titleStyles = {
    sm: 'text-sm font-medium text-muted-foreground',
    md: 'text-base font-semibold text-card-foreground',
    lg: 'text-xl font-bold text-card-foreground',
  };

  // 액션 버튼 렌더링
  const renderAction = () => {
    if (!action) return null;

    return (
      <ViewMoreButton
        href={action.href}
        onClick={action.onClick}
        variant="muted"
        hideIcon={action.hideIcon}
      >
        {action.label}
      </ViewMoreButton>
    );
  };

  // 배지 렌더링
  const renderBadge = () => {
    if (badge === undefined) return null;

    return (
      <span className="text-xs text-muted-foreground">
        {typeof badge === 'number' ? `${badge}개` : badge}
      </span>
    );
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-2">
        <h2 className={titleStyles[size]}>{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {renderBadge()}
        {rightSlot ?? renderAction()}
      </div>
    </div>
  );
}
