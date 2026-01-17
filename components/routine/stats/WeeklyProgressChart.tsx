'use client';

import { CheckCircleIcon, XCircleIcon, ClockIcon, MinusIcon } from '@phosphor-icons/react';
import type { WeeklyStats } from '@/hooks/routine';
import type { EventStatus } from '@/lib/types/routine';

interface WeeklyProgressChartProps {
  stats: WeeklyStats;
}

/**
 * 일별 현황 차트
 *
 * 요일별 운동/식단 완료 상태를 테이블로 표시
 */
export default function WeeklyProgressChart({ stats }: WeeklyProgressChartProps) {
  const { dailyStats } = stats;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-medium text-foreground mb-4">일별 현황</h3>

      {/* 테이블 헤더 */}
      <div className="grid grid-cols-8 gap-1 text-center mb-2">
        <div className="text-xs text-muted-foreground" />
        {dailyStats.map((day) => (
          <div
            key={day.date}
            className="text-xs font-medium text-muted-foreground"
          >
            {day.dayOfWeek}
          </div>
        ))}
      </div>

      {/* 운동 행 */}
      <div className="grid grid-cols-8 gap-1 items-center mb-2">
        <div className="text-xs text-muted-foreground">운동</div>
        {dailyStats.map((day) => (
          <div key={`workout-${day.date}`} className="flex justify-center">
            <StatusIcon status={day.workout} />
          </div>
        ))}
      </div>

      {/* 식단 행 */}
      <div className="grid grid-cols-8 gap-1 items-center">
        <div className="text-xs text-muted-foreground">식단</div>
        {dailyStats.map((day) => (
          <div key={`meal-${day.date}`} className="flex justify-center">
            <StatusIcon status={day.meal} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 상태 아이콘 컴포넌트
 */
function StatusIcon({ status }: { status: EventStatus | null }) {
  if (status === null) {
    return <MinusIcon size={16} className="text-muted-foreground/40" />;
  }

  switch (status) {
    case 'completed':
      return <CheckCircleIcon size={16} weight="fill" className="text-primary" />;
    case 'scheduled':
      return <ClockIcon size={16} weight="duotone" className="text-amber-500" />;
    case 'skipped':
      return <XCircleIcon size={16} weight="fill" className="text-muted-foreground" />;
    default:
      return <MinusIcon size={16} className="text-muted-foreground/40" />;
  }
}
