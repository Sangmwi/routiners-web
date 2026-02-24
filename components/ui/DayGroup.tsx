interface DayGroupProps {
  /** 날짜 숫자 (예: "24") */
  dateNum: string;
  /** 요일 (예: "월") */
  dayOfWeek: string;
  isToday?: boolean;
  /** 'large' 모드: 루틴 페이지에서 확대된 크기로 표시 */
  size?: 'default' | 'large';
  children: React.ReactNode;
}

/**
 * 요일/날짜 그룹 레이아웃
 *
 * [DateNum]  [ActivityRows...]
 * [DayOfWk]
 *
 * - 오늘이면 full-bleed 배경 하이라이트 + primary 색상 텍스트
 */
export default function DayGroup({
  dateNum,
  dayOfWeek,
  isToday = false,
  size = 'default',
  children,
}: DayGroupProps) {
  const isLarge = size === 'large';

  return (
    <div className={isToday ? '-mx-(--layout-padding-x) px-(--layout-padding-x) bg-primary/10 is-today' : ''}>
      <div className={`flex ${isLarge ? 'gap-3 py-4' : 'gap-2.5 py-3'}`}>
        {/* 날짜 라벨 */}
        <div className="shrink-0 flex flex-col items-center justify-center px-2 min-w-9 tabular-nums">
          <span
            className={`${isLarge ? 'text-sm' : 'text-xs'} ${
              isToday ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground'
            }`}
          >
            {dateNum}
          </span>
          <span
            className={`${isLarge ? 'text-[11px]' : 'text-[10px]'} ${
              isToday ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {dayOfWeek}
          </span>
        </div>

        {/* 활동 행 */}
        <div className={`flex-1 min-w-0 ${isLarge ? 'space-y-1' : 'space-y-0.5'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
