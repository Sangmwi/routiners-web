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
 * [DateNum DayOfWk]  [ActivityRows...]
 *
 * - 날짜 숫자 + 요일 가로 나열
 * - 오늘이면 배경 하이라이트 + primary 색상 텍스트
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
    <div>
      <div className={`rounded-2xl px-4 ${isLarge ? 'py-4' : 'py-3'} ${isToday ? 'bg-surface-accent' : ''}`}>
        <div className={`flex ${isLarge ? 'gap-3' : 'gap-2.5'}`}>
          {/* 날짜 라벨: 숫자 + 요일 가로 배치 */}
          <div className={`${isLarge ? 'w-10' : 'w-8'} shrink-0 flex items-baseline gap-1`}>
            <span
              className={`${isLarge ? 'text-sm' : 'text-xs'} ${
                isToday ? 'font-bold text-primary' : 'font-semibold text-muted-foreground'
              }`}
            >
              {dateNum}
            </span>
            <span
              className={`${isLarge ? 'text-[11px]' : 'text-[10px]'} ${
                isToday ? 'text-primary/70' : 'text-muted-foreground'
              }`}
            >
              {dayOfWeek}
            </span>
          </div>

          {/* 활동 행 */}
          <div className={`flex-1 min-w-0 ${isLarge ? 'space-y-3' : 'space-y-2'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
