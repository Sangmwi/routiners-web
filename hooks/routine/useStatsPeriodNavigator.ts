'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  addDays,
  formatDate,
  getMonthRange,
  getWeekRange,
} from '@/lib/utils/dateHelpers';

export type StatsPeriod = 'weekly' | 'monthly';

interface MonthYear {
  year: number;
  month: number;
}

interface UseStatsPeriodNavigatorReturn {
  period: StatsPeriod;
  setPeriod: (period: StatsPeriod) => void;
  weekBaseDate: Date;
  monthYear: MonthYear;
  label: string;
  yearLabel?: string;
  canGoNext: boolean;
  weekDateStr: string;
  handlePrev: () => void;
  handleNext: () => void;
  handleToday: () => void;
}

export function useStatsPeriodNavigator(
  initialPeriod: StatsPeriod = 'weekly',
): UseStatsPeriodNavigatorReturn {
  const [period, setPeriod] = useState<StatsPeriod>(initialPeriod);
  const [weekBaseDate, setWeekBaseDate] = useState(() => new Date());
  const [monthYear, setMonthYear] = useState<MonthYear>(() => ({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  }));

  const weekRange = useMemo(() => getWeekRange(weekBaseDate), [weekBaseDate]);
  const monthRange = useMemo(
    () => getMonthRange(monthYear.year, monthYear.month),
    [monthYear],
  );

  const label = period === 'weekly' ? weekRange.weekLabel : monthRange.monthLabel;
  const yearLabel = period === 'weekly' ? `${weekBaseDate.getFullYear()}년` : undefined;

  const canGoNext = useMemo(() => {
    const today = new Date();
    if (period === 'weekly') {
      return new Date(weekRange.endDate) < today;
    }

    return (
      monthYear.year < today.getFullYear() ||
      (monthYear.year === today.getFullYear() &&
        monthYear.month < today.getMonth() + 1)
    );
  }, [period, weekRange.endDate, monthYear]);

  const handlePrev = useCallback(() => {
    if (period === 'weekly') {
      setWeekBaseDate((prev) => addDays(prev, -7));
      return;
    }

    setMonthYear((prev) => {
      if (prev.month === 1) {
        return { year: prev.year - 1, month: 12 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  }, [period]);

  const handleNext = useCallback(() => {
    if (!canGoNext) return;

    if (period === 'weekly') {
      setWeekBaseDate((prev) => addDays(prev, 7));
      return;
    }

    setMonthYear((prev) => {
      if (prev.month === 12) {
        return { year: prev.year + 1, month: 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  }, [period, canGoNext]);

  const handleToday = useCallback(() => {
    const now = new Date();
    setWeekBaseDate(now);
    setMonthYear({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
  }, []);

  return {
    period,
    setPeriod,
    weekBaseDate,
    monthYear,
    label,
    yearLabel,
    canGoNext,
    weekDateStr: formatDate(weekBaseDate),
    handlePrev,
    handleNext,
    handleToday,
  };
}
