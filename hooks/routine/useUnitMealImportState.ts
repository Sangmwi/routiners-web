'use client';

import { useState, useEffect, useRef } from 'react';
import { useCurrentUserProfile } from '@/hooks/profile';
import { useCreateMealEventsBatch } from '@/hooks/routine';
import { useShowError } from '@/lib/stores/errorStore';
import { unitMealApi } from '@/lib/api/unitMeal';
import { routineEventApi } from '@/lib/api/routineEvent';
import { UNITS } from '@/lib/constants/units';
import { formatDate, addDays, parseDate, getToday } from '@/lib/utils/dateHelpers';
import type { UnitMealMenu } from '@/lib/types/unitMeal';
import type { MealData } from '@/lib/types/meal';
import type { RoutineEventCreateData } from '@/lib/types/routine';
import type { DayImportStatus } from '@/components/routine/sheets/UnitMealProgressPanel';

// ── helpers ──────────────────────────────────────────────────────────────────

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = parseDate(start);
  const endDate = parseDate(end);
  while (current <= endDate) {
    dates.push(formatDate(current));
    current = addDays(current, 1);
  }
  return dates;
}

function menuToEventData(menu: UnitMealMenu): RoutineEventCreateData {
  const mealData: MealData = {
    meals: menu.meals.map((m) => ({
      type: m.type,
      time: m.time,
      foods: m.foods,
      totalCalories: m.totalCalories,
      totalProtein: m.totalProtein,
      totalCarbs: m.totalCarbs,
      totalFat: m.totalFat,
    })),
    estimatedTotalCalories: menu.estimatedTotalCalories,
  };
  return {
    type: 'meal',
    date: menu.date,
    title: `${menu.unitName} 식단`,
    source: 'user',
    data: mealData,
  };
}

// ── hook ─────────────────────────────────────────────────────────────────────

const MAX_DAYS = 14;

export function useUnitMealImportState(anchorDate: string) {
  const showError = useShowError();
  const { data: user } = useCurrentUserProfile();
  const createBatch = useCreateMealEventsBatch();

  const today = getToday();
  const effectiveAnchor = anchorDate < today ? today : anchorDate;

  // Step
  const [step, setStep] = useState<'select' | 'importing'>('select');

  // Unit selection
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');

  // Date range
  const [startDate, setStartDate] = useState(effectiveAnchor);
  const [endDate, setEndDate] = useState(formatDate(addDays(parseDate(effectiveAnchor), 6)));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [existingMealDates, setExistingMealDates] = useState<Set<string>>(new Set());
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);

  // Import progress
  const [dayStatuses, setDayStatuses] = useState<Map<string, DayImportStatus>>(new Map());
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [skippedDates, setSkippedDates] = useState<string[]>([]);
  const [failedDates, setFailedDates] = useState<string[]>([]);
  const abortRef = useRef(false);

  // 사용자 프로필에서 기본 부대 설정
  useEffect(() => {
    if (user?.unitId && !selectedUnitId) setSelectedUnitId(user.unitId);
  }, [user?.unitId, selectedUnitId]);

  // 시작일 변경 시 종료일 보정
  useEffect(() => {
    if (endDate < startDate) setEndDate(startDate);
    const maxEnd = formatDate(addDays(parseDate(startDate), MAX_DAYS - 1));
    if (endDate > maxEnd) setEndDate(maxEnd);
  }, [startDate, endDate]);

  // 부대 + 날짜 범위 변경 시 기존 식단 확인
  useEffect(() => {
    if (!selectedUnitId || step !== 'select') return;
    const checkExisting = async () => {
      setIsCheckingExisting(true);
      try {
        const events = await routineEventApi.getEvents({ startDate, endDate, type: 'meal' });
        setExistingMealDates(new Set(events.map((e) => e.date)));
      } catch {
        setExistingMealDates(new Set());
      } finally {
        setIsCheckingExisting(false);
      }
    };
    checkExisting();
  }, [step, startDate, endDate, selectedUnitId]);

  // Computed values
  const activeUnits = UNITS.filter((u) => u.isActive);
  const filteredUnits = unitSearchQuery
    ? activeUnits.filter((u) => u.name.includes(unitSearchQuery))
    : activeUnits;
  const selectedUnit = UNITS.find((u) => u.id === selectedUnitId);

  const maxEnd = formatDate(addDays(parseDate(startDate), MAX_DAYS - 1));
  const effectiveEndDate = endDate < startDate ? startDate : endDate > maxEnd ? maxEnd : endDate;
  const allDates = getDateRange(startDate, effectiveEndDate);
  const newDates = allDates.filter((d) => !existingMealDates.has(d));
  const isRangeValid =
    startDate <= effectiveEndDate && startDate >= today && allDates.length <= MAX_DAYS;

  const totalTargetDates = newDates.length;
  const completedCount = Array.from(dayStatuses.values()).filter(
    (s) => s === 'saved' || s === 'skipped' || s === 'error' || s === 'fetched',
  ).length;
  const progress = totalTargetDates > 0 ? Math.round((completedCount / totalTargetDates) * 100) : 0;

  // ── actions ──────────────────────────────────────────────────────────────

  const handleStartImport = async () => {
    if (newDates.length === 0) return;

    setStep('importing');
    setIsImporting(true);
    setImportDone(false);
    abortRef.current = false;

    const initialStatuses = new Map<string, DayImportStatus>();
    newDates.forEach((d) => initialStatuses.set(d, 'pending'));
    setDayStatuses(new Map(initialStatuses));

    const { menus, failedDates: fetchFailed } = await unitMealApi.fetchBatchMenus(
      selectedUnitId,
      newDates,
      (fetchDate, status) => {
        if (abortRef.current) return;
        setDayStatuses((prev) => {
          const next = new Map(prev);
          next.set(
            fetchDate,
            status === 'fetching' ? 'fetching' : status === 'fetched' ? 'fetched' : 'error',
          );
          return next;
        });
      },
    );

    if (abortRef.current) return;
    setFailedDates(fetchFailed);

    if (menus.length === 0) {
      setImportDone(true);
      setIsImporting(false);
      return;
    }

    setDayStatuses((prev) => {
      const next = new Map(prev);
      menus.forEach((m) => {
        if (next.get(m.date) === 'fetched') next.set(m.date, 'saving');
      });
      return next;
    });

    const events = menus.map(menuToEventData);
    createBatch.mutate(
      { events },
      {
        onSuccess: (result) => {
          if (abortRef.current) return;
          const createdDates = new Set(result.created.map((e) => e.date));
          const serverSkipped = result.skipped;
          setDayStatuses((prev) => {
            const next = new Map(prev);
            menus.forEach((m) => {
              if (createdDates.has(m.date)) next.set(m.date, 'saved');
              else if (serverSkipped.includes(m.date)) next.set(m.date, 'skipped');
            });
            return next;
          });
          setSavedCount(result.created.length);
          setSkippedDates(serverSkipped);
          setImportDone(true);
          setIsImporting(false);
        },
        onError: () => {
          if (abortRef.current) return;
          showError('식단 저장에 실패했어요');
          setDayStatuses((prev) => {
            const next = new Map(prev);
            menus.forEach((m) => {
              if (next.get(m.date) === 'saving') next.set(m.date, 'error');
            });
            return next;
          });
          setImportDone(true);
          setIsImporting(false);
        },
      },
    );
  };

  const resetState = () => {
    setStep('select');
    setShowUnitPicker(false);
    setUnitSearchQuery('');
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    setStartDate(effectiveAnchor);
    setEndDate(formatDate(addDays(parseDate(effectiveAnchor), 6)));
    setExistingMealDates(new Set());
    setDayStatuses(new Map());
    setIsImporting(false);
    setImportDone(false);
    setSavedCount(0);
    setSkippedDates([]);
    setFailedDates([]);
  };

  return {
    // unit selection
    selectedUnit,
    selectedUnitId,
    setSelectedUnitId,
    showUnitPicker,
    setShowUnitPicker,
    unitSearchQuery,
    setUnitSearchQuery,
    filteredUnits,
    // date range
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    // computed
    today,
    maxDays: MAX_DAYS,
    allDates,
    newDates,
    isRangeValid,
    effectiveEndDate,
    existingMealDates,
    isCheckingExisting,
    // import progress
    step,
    dayStatuses,
    isImporting,
    importDone,
    progress,
    savedCount,
    skippedDates,
    failedDates,
    // actions
    handleStartImport,
    resetState,
    abortRef,
  };
}
