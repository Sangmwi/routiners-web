import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** 너비 (기본: 100%) */
  width?: string | number;

  /** 높이 (기본: auto) */
  height?: string | number;

  /** 원형 스켈레톤 (기본: false) */
  circle?: boolean;

  /** 애니메이션 비활성화 (기본: false) */
  noAnimation?: boolean;
}

/**
 * 기본 Skeleton 컴포넌트
 *
 * @example
 * <Skeleton width="100px" height="20px" />
 * <Skeleton circle width="40px" height="40px" />
 */
export function Skeleton({
  width,
  height,
  circle = false,
  noAnimation = false,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = 'bg-muted';
  const animationStyles = noAnimation ? '' : 'animate-pulse';
  const shapeStyles = circle ? 'rounded-full' : 'rounded-lg';

  const inlineStyles = {
    width: width || '100%',
    height: height || 'auto',
    ...style,
  };

  return (
    <div
      className={`${baseStyles} ${animationStyles} ${shapeStyles} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
}

/**
 * 텍스트 라인 Skeleton
 */
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="16px"
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * 카드 Skeleton
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-2xl bg-card p-4 shadow-sm border border-edge-subtle ${className}`}>
      <Skeleton height="160px" className="mb-3" />
      <Skeleton height="20px" width="80%" className="mb-2" />
      <Skeleton height="16px" width="60%" />
    </div>
  );
}

/**
 * 프로필 Skeleton
 */
export function SkeletonProfile({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Skeleton circle width="48px" height="48px" />
      <div className="flex-1">
        <Skeleton height="16px" width="120px" className="mb-2" />
        <Skeleton height="14px" width="80px" />
      </div>
    </div>
  );
}

/**
 * 리스트 아이템 Skeleton
 */
export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 p-4 ${className}`}>
      <Skeleton circle width="40px" height="40px" />
      <div className="flex-1">
        <Skeleton height="16px" width="60%" className="mb-2" />
        <Skeleton height="14px" width="40%" />
      </div>
    </div>
  );
}

/**
 * 그리드 Skeleton (ProductCard 등)
 */
export function SkeletonGrid({
  columns = 2,
  items = 4,
  className = '',
}: {
  columns?: number;
  items?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// PulseLoader는 별도 파일에서 export
export { PulseLoader } from './PulseLoader';

export default Skeleton;
