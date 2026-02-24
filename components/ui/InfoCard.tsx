'use client';

import { ReactNode } from 'react';

// ============================================================
// Types
// ============================================================

interface InfoCardProps {
  /** 좌측 아이콘 */
  icon: ReactNode;
  /** 상단 라벨 */
  label: string;
  /** 메인 값 */
  value: string | ReactNode;
  /** 부가 정보 (서브 텍스트) */
  subValue?: string;
  /** 스타일 변형 */
  variant?: 'default' | 'compact' | 'flat';
  /** 추가 클래스 */
  className?: string;
}

// ============================================================
// Component
// ============================================================

/**
 * 정보 카드 공통 컴포넌트
 *
 * @example
 * // 기본 사용
 * <InfoCard
 *   icon={<Shield />}
 *   label="계급"
 *   value="상병"
 * />
 *
 * // 부가 정보 포함
 * <InfoCard
 *   icon={<Building2 />}
 *   label="부대명"
 *   value="육군 제1사단"
 *   subValue="12사단 → 현재"
 * />
 *
 * // 컴팩트 버전
 * <InfoCard
 *   icon={<Calendar />}
 *   label="전역일"
 *   value="2025.03.15"
 *   variant="compact"
 * />
 */
export default function InfoCard({
  icon,
  label,
  value,
  subValue,
  variant = 'default',
  className = '',
}: InfoCardProps) {
  // variant별 스타일
  const containerStyles = {
    default:
      'flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-edge-subtle',
    compact:
      'flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-edge-subtle',
    flat:
      'flex items-center gap-3 px-4 py-3.5',
  };

  const iconContainerStyles = {
    default: 'w-4 h-4 text-muted-foreground flex-shrink-0 [&>svg]:w-full [&>svg]:h-full',
    compact: 'w-3.5 h-3.5 text-muted-foreground flex-shrink-0 [&>svg]:w-full [&>svg]:h-full',
    flat: 'w-4 h-4 text-muted-foreground flex-shrink-0 [&>svg]:w-full [&>svg]:h-full',
  };

  const labelStyles = {
    default: 'text-xs text-muted-foreground mb-0.5',
    compact: 'text-xs text-muted-foreground',
    flat: 'text-xs text-muted-foreground mb-0.5',
  };

  const valueStyles = {
    default: 'text-sm text-card-foreground font-medium',
    compact: 'text-sm text-card-foreground',
    flat: 'text-sm text-foreground font-medium',
  };

  return (
    <div className={`${containerStyles[variant]} ${className}`}>
      {/* 아이콘 */}
      <div className={iconContainerStyles[variant]}>{icon}</div>

      {/* 텍스트 영역 */}
      <div className="flex-1 min-w-0">
        <p className={labelStyles[variant]}>{label}</p>
        <div className={valueStyles[variant]}>
          {typeof value === 'string' ? (
            <span className="truncate block">{value}</span>
          ) : (
            value
          )}
        </div>
        {subValue && (
          <p className="text-xs text-hint-strong mt-0.5 truncate">
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}
