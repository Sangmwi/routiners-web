'use client';

import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MinusIcon,
  BarbellIcon,
  ForkKnifeIcon,
} from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils/dateHelpers';
import type { WeeklyStats } from '@/hooks/routine';
import type { EventStatus } from '@/lib/types/routine';

interface WeeklyProgressChartProps {
  stats: WeeklyStats;
}

/**
 * 일별 현황 차트
 *
 * 운동/식단 분리 섹션, 7-column 상태 아이콘 그리드
 * WeeklyOverview와 동일한 레이아웃/스타일
 */
export default function WeeklyProgressChart({ stats }: WeeklyProgressChartProps) {
  const { dailyStats } = stats;
  const today = formatDate(new Date());

  const wCompleted = dailyStats.filter(d => d.workout === 'completed').length;
  const wTotal = dailyStats.filter(d => d.workout !== null).length;

  const mCompleted = dailyStats.filter(d => d.meal === 'completed').length;
  const mTotal = dailyStats.filter(d => d.meal !== null).length;

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-foreground">일별 현황</h3>

      {/* 운동 */}
      <div>
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-1.5">
            <BarbellIcon size={16} weight="fill" className="text-primary" />
            <span className="text-sm font-medium text-foreground">운동</span>
          </div>
          {wTotal > 0 ? (
            <span className="text-xs font-medium text-muted-foreground">{wCompleted}/{wTotal}</span>
          ) : (
            <span className="text-xs text-muted-foreground/60">예정 없음</span>
          )}
        </div>
        <div className="rounded-xl bg-muted/20 px-2.5 py-4">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {dailyStats.map((day) => (
              <span
                key={day.date}
                className={`text-[10px] ${day.date === today ? 'text-primary font-semibold' : 'text-muted-foreground font-medium'}`}
              >
                {day.dayOfWeek}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 items-center">
            {dailyStats.map((day) => (
              <StatusIcon
                key={`w-${day.date}`}
                status={day.workout}
                isToday={day.date === today}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 식단 */}
      <div>
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-1.5">
            <ForkKnifeIcon size={16} weight="fill" className="text-primary/70" />
            <span className="text-sm font-medium text-foreground">식단</span>
          </div>
          {mTotal > 0 ? (
            <span className="text-xs font-medium text-muted-foreground">{mCompleted}/{mTotal}</span>
          ) : (
            <span className="text-xs text-muted-foreground/60">예정 없음</span>
          )}
        </div>
        <div className="rounded-xl bg-muted/20 px-2.5 py-4">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {dailyStats.map((day) => (
              <span
                key={day.date}
                className={`text-[10px] ${day.date === today ? 'text-primary font-semibold' : 'text-muted-foreground font-medium'}`}
              >
                {day.dayOfWeek}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 items-center">
            {dailyStats.map((day) => (
              <StatusIcon
                key={`m-${day.date}`}
                status={day.meal}
                isToday={day.date === today}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status, isToday }: { status: EventStatus | null; isToday: boolean }) {
  const size = 16;

  if (status === 'completed') {
    return (
      <div className="flex justify-center">
        <CheckCircleIcon size={size} weight="fill" className="text-primary" />
      </div>
    );
  }
  if (status === 'scheduled') {
    return (
      <div className="flex justify-center">
        <ClockIcon
          size={size}
          weight="duotone"
          className={isToday ? 'text-primary' : 'text-amber-500'}
        />
      </div>
    );
  }
  if (status === 'skipped') {
    return (
      <div className="flex justify-center">
        <XCircleIcon size={size} weight="fill" className="text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <MinusIcon size={size} className="text-muted-foreground/30" />
    </div>
  );
}
