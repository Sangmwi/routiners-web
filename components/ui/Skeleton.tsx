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
  const baseStyles = 'bg-muted/50';
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
    <div className={`rounded-2xl bg-card p-4 shadow-sm border border-border/50 ${className}`}>
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

/**
 * 토스 스타일 페이지 스켈레톤
 * - 추상적인 레이아웃
 * - 시간차 shimmer 애니메이션
 * - 다이나믹한 웨이브 효과
 */
export function PageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* 헤더 영역 */}
      <div className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex h-14 items-center justify-between px-4">
          <Skeleton height="24px" width="100px" className="skeleton-delay-1" />
          <Skeleton circle height="32px" width="32px" className="skeleton-delay-2" />
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 space-y-6 p-4">
        {/* 프로필/히어로 섹션 */}
        <div className="flex items-center gap-4">
          <Skeleton circle height="64px" width="64px" className="skeleton-delay-1 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton height="20px" width="128px" className="skeleton-delay-2" />
            <Skeleton height="16px" width="180px" className="skeleton-delay-3" />
          </div>
        </div>

        {/* 카드 섹션 */}
        <div className="space-y-3">
          <Skeleton height="16px" width="80px" className="skeleton-delay-2" />
          <div className="rounded-xl border border-border/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton height="40px" width="40px" className="skeleton-delay-3 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton height="16px" width="75%" className="skeleton-delay-4" />
                <Skeleton height="12px" width="50%" className="skeleton-delay-5" />
              </div>
            </div>
          </div>
        </div>

        {/* 리스트 섹션 */}
        <div className="space-y-3">
          <Skeleton height="16px" width="96px" className="skeleton-delay-3" />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border/50 p-4"
            >
              <Skeleton
                height="48px"
                width="48px"
                className={`skeleton-delay-${i + 3} rounded-lg`}
              />
              <div className="flex-1 space-y-2">
                <Skeleton
                  height="16px"
                  width="66%"
                  className={`skeleton-delay-${i + 4}`}
                />
                <Skeleton
                  height="12px"
                  width="33%"
                  className={`skeleton-delay-${i + 5}`}
                />
              </div>
              <Skeleton
                height="32px"
                width="64px"
                className={`skeleton-delay-${i + 5} rounded-full`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
