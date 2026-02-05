'use client';

import { formatDate } from '@/lib/utils/dateHelpers';
import type { EventStatus } from '@/lib/types/routine';

interface DailyStatItem {
  date: string;
  dayOfWeek: string;
  workout: EventStatus | null;
  meal: EventStatus | null;
}

interface WeekDotsProps {
  dailyStats: DailyStatItem[];
}

type DotStatus = 'completed' | 'skipped' | 'today' | 'scheduled' | 'empty';

/**
 * 7일 도트 미니 캘린더
 * - 완료: 채워진 원 (primary)
 * - 오늘: 테두리 원 (primary)
 * - 예정: 빈 원 (muted)
 * - 건너뜀: 채도 낮은 원
 */
export function WeekDots({ dailyStats }: WeekDotsProps) {
  const today = formatDate(new Date());

  return (
    <div className="flex justify-between px-2">
      {dailyStats.map((day) => {
        const isToday = day.date === today;
        const hasCompleted = day.workout === 'completed' || day.meal === 'completed';
        const hasSkipped = day.workout === 'skipped' || day.meal === 'skipped';
        const hasScheduled = day.workout === 'scheduled' || day.meal === 'scheduled';

        let status: DotStatus;
        if (hasCompleted) {
          status = 'completed';
        } else if (hasSkipped) {
          status = 'skipped';
        } else if (isToday) {
          status = 'today';
        } else if (hasScheduled) {
          status = 'scheduled';
        } else {
          status = 'empty';
        }

        return (
          <div key={day.date} className="flex flex-col items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              {day.dayOfWeek}
            </span>
            <DotIndicator status={status} />
          </div>
        );
      })}
    </div>
  );
}

function DotIndicator({ status }: { status: DotStatus }) {
  const styles: Record<DotStatus, string> = {
    completed: 'bg-primary',
    today: 'border-2 border-primary bg-transparent',
    scheduled: 'bg-muted',
    skipped: 'bg-destructive/50',
    empty: 'bg-muted/50',
  };

  return (
    <div className={`w-3.5 h-3.5 rounded-full ${styles[status]}`} />
  );
}

export default WeekDots;
