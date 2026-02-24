interface DayGroupProps {
  dayLabel: string;
  isToday?: boolean;
  labelWidth?: string;
  children: React.ReactNode;
}

/**
 * 요일/날짜 그룹 레이아웃
 *
 * [DayLabel] [ActivityRows...]
 * - 오늘이면 배경 하이라이트 + 라벨 primary 색상
 * - WeeklyProgressChart, UpcomingSection 등에서 공유
 */
export default function DayGroup({
  dayLabel,
  isToday = false,
  labelWidth = 'w-6',
  children,
}: DayGroupProps) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${isToday ? 'bg-surface-accent' : ''}`}>
      <div className="flex gap-3">
        <span
          className={`text-xs font-semibold ${labelWidth} shrink-0 pt-0.5 ${
            isToday ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          {dayLabel}
        </span>
        <div className="flex-1 min-w-0 space-y-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}
