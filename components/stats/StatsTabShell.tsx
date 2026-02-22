'use client';

import { type ReactNode, Suspense, useState } from 'react';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import DateJumpSheet from '@/components/ui/DateJumpSheet';
import { PulseLoader } from '@/components/ui/PulseLoader';
import { useStatsPeriodNavigator } from '@/hooks/routine';
import { formatDate, parseDate } from '@/lib/utils/dateHelpers';
import PeriodTabs from './PeriodTabs';

interface StatsTabShellProps {
  weeklyContent: (dateStr: string) => ReactNode;
  monthlyContent: (year: number, month: number) => ReactNode;
  /** Suspense 밖에 렌더링되는 추가 콘텐츠 (e.g. Big3 섹션) */
  children?: ReactNode;
}

export default function StatsTabShell({
  weeklyContent,
  monthlyContent,
  children,
}: StatsTabShellProps) {
  const {
    period,
    setPeriod,
    setWeekBaseDate,
    monthYear,
    setMonthYear,
    label,
    yearLabel,
    canGoNext,
    handlePrev,
    handleNext,
    weekDateStr,
  } = useStatsPeriodNavigator('weekly');
  const [isDateJumpOpen, setIsDateJumpOpen] = useState(false);
  const [dateJumpSession, setDateJumpSession] = useState(0);

  const today = new Date();
  const todayStr = formatDate(today);
  const startYear = today.getFullYear() - 5;
  const minDate = `${startYear}-01-01`;

  return (
    <div>
      <PeriodTabs
        period={period}
        onPeriodChange={setPeriod}
        label={label}
        yearLabel={yearLabel}
        onPrev={handlePrev}
        onNext={handleNext}
        canGoNext={canGoNext}
        onDateLabelClick={() => {
          setDateJumpSession((prev) => prev + 1);
          setIsDateJumpOpen(true);
        }}
        dateLabelAriaLabel={period === 'weekly' ? '주간 날짜 선택' : '월간 날짜 선택'}
      />

      <div className="mt-6">
        <QueryErrorBoundary>
          <Suspense fallback={<PulseLoader />}>
            {period === 'weekly'
              ? weeklyContent(weekDateStr)
              : monthlyContent(monthYear.year, monthYear.month)}
          </Suspense>
        </QueryErrorBoundary>
      </div>

      {children}

      {period === 'weekly' ? (
        <DateJumpSheet
          key={`date-${dateJumpSession}`}
          mode="date"
          isOpen={isDateJumpOpen}
          onClose={() => setIsDateJumpOpen(false)}
          title="주간 날짜 선택"
          value={weekDateStr}
          minDate={minDate}
          maxDate={todayStr}
          onConfirm={({ date }) => {
            setWeekBaseDate(parseDate(date));
          }}
        />
      ) : (
        <DateJumpSheet
          key={`month-${dateJumpSession}`}
          mode="yearMonth"
          isOpen={isDateJumpOpen}
          onClose={() => setIsDateJumpOpen(false)}
          title="월간 날짜 선택"
          year={String(monthYear.year)}
          month={String(monthYear.month).padStart(2, '0')}
          yearRange={{ start: startYear, end: today.getFullYear() }}
          onConfirm={({ year, month }) => {
            setMonthYear({
              year: parseInt(year, 10),
              month: parseInt(month, 10),
            });
          }}
        />
      )}
    </div>
  );
}
