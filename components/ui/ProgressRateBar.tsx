import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import ComparisonBadge from './ComparisonBadge';

interface ProgressRateBarProps {
  icon: PhosphorIcon;
  label: string;
  completionRate: number;
  completed: number;
  total: number;
  comparison?: {
    diff: number;
    label: string;
  };
}

/**
 * 진행률 바 (운동/식단 공통)
 *
 * [Icon Label]
 * [BIG 0%]              [0/3개 완료]
 * [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━]
 * [▼N% 지난주 대비]
 */
export default function ProgressRateBar({
  icon: Icon,
  label,
  completionRate,
  completed,
  total,
  comparison,
}: ProgressRateBarProps) {
  return (
    <div className="rounded-2x p-2">
      {/* 타이틀 */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={15} weight="fill" className="text-primary" />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>

      {/* 히어로 % + 완료 수 */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-bold text-foreground tracking-tight">
          {completionRate}%
        </span>
        <span className="text-xs text-muted-foreground">
          {total > 0 ? `${completed}/${total}개 완료` : '일정 없음'}
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
        />
      </div>

      {/* 비교 배지 */}
      {comparison && comparison.diff !== 0 && (
        <div className="mt-2">
          <ComparisonBadge diff={comparison.diff} label={comparison.label} />
        </div>
      )}
    </div>
  );
}
