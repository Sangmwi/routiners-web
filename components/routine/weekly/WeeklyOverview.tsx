'use client';

import AppLink from '@/components/common/AppLink';
import {
  SparkleIcon,
  CaretRightIcon,
  BarbellIcon,
  BowlFoodIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MinusIcon,
} from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils/dateHelpers';
import { getDisplayStatus } from '@/lib/config/theme';
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
    stats.meal.scheduled +
    stats.meal.completed;

  // 이벤트 없음 - 루틴 생성 안내
  if (totalEvents === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">이번 주</h2>
        <div className="rounded-2xl bg-muted/20 p-4 text-center">
          <SparkleIcon size={24} weight="duotone" className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            AI 상담으로 루틴을 생성해보세요
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
        <AppLink href="/stats" className="text-sm font-medium text-primary flex items-center gap-0.5">
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
          <DayGrid
            dailyStats={stats.dailyStats}
            today={today}
            statusKey="workout"
          />
        </div>

        {/* 식단 */}
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-1.5">
              <BowlFoodIcon size={16} weight="fill" className="text-primary" />
              <span className="text-sm font-medium text-foreground">식단</span>
            </div>
            {mTotal > 0 ? (
              <span className="text-xs font-medium text-muted-foreground">{mCompleted}/{mTotal}</span>
            ) : (
              <span className="text-xs text-muted-foreground/60">예정 없음</span>
            )}
          </div>
          <DayGrid
            dailyStats={stats.dailyStats}
            today={today}
            statusKey="meal"
          />
        </div>
      </div>
    </section>
  );
}

interface DayGridProps {
  dailyStats: WeeklyStats['dailyStats'];
  today: string;
  statusKey: 'workout' | 'meal';
}

function DayGrid({ dailyStats, today, statusKey }: DayGridProps) {
  return (
    <div className="rounded-xl bg-muted/20 px-2.5 py-2">
      <div className="grid grid-cols-7 gap-1">
        {dailyStats.map((day) => {
          const isToday = day.date === today;
          const hasEvent = day[statusKey] !== null;
          const content = (
            <>
              <span
                className={`text-[10px] ${
                  isToday
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground font-medium'
                }`}
              >
                {day.dayOfWeek}
              </span>
              <StatusIcon status={day[statusKey]} date={day.date} isToday={isToday} />
            </>
          );
          const className = `flex flex-col items-center gap-2 py-2.5 rounded-lg ${
            isToday ? 'bg-primary/10' : ''
          }`;

          return hasEvent ? (
            <AppLink
              key={day.date}
              href={`/routine/${statusKey}/${day.date}`}
              className={className}
            >
              {content}
            </AppLink>
          ) : (
            <div key={day.date} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusIcon({ status, date, isToday }: { status: EventStatus | null; date: string; isToday: boolean }) {
  if (!status) {
    return (
      <div className="flex justify-center">
        <MinusIcon size={12} className="text-muted-foreground/30 h-4!" />
      </div>
    );
  }

  const displayStatus = getDisplayStatus(status, date);

  if (displayStatus === 'completed') {
    return (
      <div className="flex justify-center">
        <CheckCircleIcon size={16} weight="fill" className="text-primary" />
      </div>
    );
  }
  if (displayStatus === 'incomplete') {
    return (
      <div className="flex justify-center">
        <XCircleIcon size={16} weight="fill" className="text-muted-foreground" />
      </div>
    );
  }
  // scheduled
  return (
    <div className="flex justify-center">
      <ClockIcon
        size={16}
        weight="duotone"
        className={isToday ? 'text-primary' : 'text-amber-500'}
      />
    </div>
  );
}

export default WeeklyOverview;
