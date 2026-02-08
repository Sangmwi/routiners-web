'use client';

import AppLink from '@/components/common/AppLink';
import {
  SparkleIcon,
  CaretRightIcon,
  BarbellIcon,
  ForkKnifeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MinusIcon,
} from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils/dateHelpers';
import type { WeeklyStats } from '@/hooks/routine';
import type { EventStatus } from '@/lib/types/routine';

interface WeeklyOverviewProps {
  stats: WeeklyStats;
}

/**
 * 이번 주 현황 섹션
 * - 운동/식단 별도 카드 (7-column 상태 아이콘 그리드)
 */
export function WeeklyOverview({ stats }: WeeklyOverviewProps) {
  const totalEvents =
    stats.workout.scheduled +
    stats.workout.completed +
    stats.workout.skipped +
    stats.meal.scheduled +
    stats.meal.completed +
    stats.meal.skipped;

  // 이벤트 없음 - 루틴 생성 안내
  if (totalEvents === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">이번 주</h2>
        <div className="rounded-2xl bg-muted/20 p-4 text-center">
          <SparkleIcon size={24} weight="duotone" className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            AI 코치로 루틴을 생성해보세요
          </p>
        </div>
      </section>
    );
  }

  const today = formatDate(new Date());

  const wCompleted = stats.dailyStats.filter(d => d.workout === 'completed').length;
  const wTotal = stats.dailyStats.filter(d => d.workout !== null).length;

  const mCompleted = stats.dailyStats.filter(d => d.meal === 'completed').length;
  const mTotal = stats.dailyStats.filter(d => d.meal !== null).length;

  return (
    <section>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">이번 주</h2>
        <AppLink href="/routine/stats" className="text-sm font-medium text-primary flex items-center gap-0.5">
          통계
          <CaretRightIcon size={16} weight="bold" />
        </AppLink>
      </div>

      {/* 운동/식단 섹션 */}
      <div className="space-y-6 pt-4">
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
              {stats.dailyStats.map((day) => (
                <span
                  key={day.date}
                  className={`text-[10px] ${day.date === today ? 'text-primary font-semibold' : 'text-muted-foreground font-medium'}`}
                >
                  {day.dayOfWeek}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 items-center">
              {stats.dailyStats.map((day) => (
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
              {stats.dailyStats.map((day) => (
                <span
                  key={day.date}
                  className={`text-[10px] ${day.date === today ? 'text-primary font-semibold' : 'text-muted-foreground font-medium'}`}
                >
                  {day.dayOfWeek}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 items-center">
              {stats.dailyStats.map((day) => (
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
    </section>
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

export default WeeklyOverview;
