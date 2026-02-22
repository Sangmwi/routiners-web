'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
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
  setWeekBaseDate: Dispatch<SetStateAction<Date>>;
  monthYear: MonthYear;
  setMonthYear: Dispatch<SetStateAction<MonthYear>>;
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

  const weekRange = getWeekRange(weekBaseDate);
  const monthRange = getMonthRange(monthYear.year, monthYear.month);

  const label = period === 'weekly' ? weekRange.weekLabel : monthRange.monthLabel;
  const yearLabel = period === 'weekly' ? `${weekBaseDate.getFullYear()}년` : undefined;

  const today = new Date();
  const canGoNext =
    period === 'weekly'
      ? new Date(weekRange.endDate) < today
      : monthYear.year < today.getFullYear() ||
        (monthYear.year === today.getFullYear() &&
          monthYear.month < today.getMonth() + 1);

  const handlePrev = () => {
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
  };

  const handleNext = () => {
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
  };

  const handleToday = () => {
    const now = new Date();
    setWeekBaseDate(now);
    setMonthYear({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });
  };

  return {
    period,
    setPeriod,
    weekBaseDate,
    setWeekBaseDate,
    monthYear,
    setMonthYear,
    label,
    yearLabel,
    canGoNext,
    weekDateStr: formatDate(weekBaseDate),
    handlePrev,
    handleNext,
    handleToday,
  };
}
