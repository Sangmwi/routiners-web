'use client';

import { useState, useEffect, useRef } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/WheelPicker';
import { LoadingSpinner } from '@/components/ui/icons';
import Button from '@/components/ui/Button';
import GradientFooter from '@/components/ui/GradientFooter';
import {
  BuildingsIcon,
  MagnifyingGlassIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  WarningCircleIcon,
  ClockIcon,
  CalendarIcon,
} from '@phosphor-icons/react';
import { useCurrentUserProfile } from '@/hooks/profile';
import { useCreateMealEventsBatch } from '@/hooks/routine';
import { useShowError } from '@/lib/stores/errorStore';
import { unitMealApi } from '@/lib/api/unitMeal';
import { routineEventApi } from '@/lib/api/routineEvent';
import { UNITS } from '@/lib/constants/units';
import {
  formatKoreanDate,
  formatDate,
  addDays,
  parseDate,
  getToday,
  getDayOfWeek,
} from '@/lib/utils/dateHelpers';
import type { UnitMealMenu } from '@/lib/types/unitMeal';
import type { MealData } from '@/lib/types/meal';
import type { RoutineEventCreateData } from '@/lib/types/routine';

// ============================================================================
// Types
// ============================================================================

interface UnitMealImportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  date: string; // anchor date
  onCreated?: () => void;
}

type Step = 'select' | 'importing';
type DayImportStatus =
  | 'pending'
  | 'fetching'
  | 'fetched'
  | 'saving'
  | 'saved'
  | 'skipped'
  | 'error';

// ============================================================================
// Sub Components
// ============================================================================

function StatusIcon({ status }: { status: DayImportStatus }) {
  switch (status) {
    case 'pending':
      return <ClockIcon size={18} className="text-hint" />;
    case 'fetching':
    case 'saving':
      return (
        <CircleNotchIcon
          size={18}
          weight="bold"
          className="text-primary animate-spin"
        />
      );
    case 'fetched':
      return <CheckCircleIcon size={18} className="text-blue-500" />;
    case 'saved':
      return (
        <CheckCircleIcon size={18} weight="fill" className="text-green-500" />
      );
    case 'skipped':
      return <WarningCircleIcon size={18} className="text-yellow-500" />;
    case 'error':
      return <WarningCircleIcon size={18} className="text-red-500" />;
  }
}

function StatusLabel({ status }: { status: DayImportStatus }) {
  const labels: Record<DayImportStatus, string> = {
    pending: '대기',
    fetching: '조회중...',
    fetched: '조회 완료',
    saving: '저장중...',
    saved: '완료',
    skipped: '이미 등록됨',
    error: '실패',
  };
  const colors: Record<DayImportStatus, string> = {
    pending: 'text-hint',
    fetching: 'text-primary',
    fetched: 'text-blue-500',
    saving: 'text-primary',
    saved: 'text-green-500',
    skipped: 'text-yellow-500',
    error: 'text-red-500',
  };
  return (
    <span className={`text-xs font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/** 시작~종료 사이의 모든 날짜 생성 */
function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  let current = startDate;
  while (current <= endDate) {
    dates.push(formatDate(current));
    current = addDays(current, 1);
  }
  return dates;
}

/** UnitMealMenu → RoutineEventCreateData 변환 */
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

// ============================================================================
// Main Component
// ============================================================================

export default function UnitMealImportDrawer({
  isOpen,
  onClose,
  date,
  onCreated,
}: UnitMealImportDrawerProps) {
  const showError = useShowError();
  const { data: user } = useCurrentUserProfile();
  const createBatch = useCreateMealEventsBatch();

  // Step
  const [step, setStep] = useState<Step>('select');

  // 부대 선택
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [unitSearchQuery, setUnitSearchQuery] = useState('');

  // 날짜 범위 (탭-확장 피커)
  const maxDays = 14;
  const today = getToday();
  const anchorDate = date < today ? today : date;
  const [startDate, setStartDate] = useState(anchorDate);
  const [endDate, setEndDate] = useState(
    formatDate(addDays(parseDate(anchorDate), 6)),
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [existingMealDates, setExistingMealDates] = useState<Set<string>>(
    new Set(),
  );
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);

  // 불러오기 진행
  const [dayStatuses, setDayStatuses] = useState<
    Map<string, DayImportStatus>
  >(new Map());
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [skippedDates, setSkippedDates] = useState<string[]>([]);
  const [failedDates, setFailedDates] = useState<string[]>([]);

  // Abort ref for cleanup
  const abortRef = useRef(false);

  // 사용자 프로필에서 기본 부대 설정
  useEffect(() => {
    if (user?.unitId && !selectedUnitId) {
      setSelectedUnitId(user.unitId);
    }
  }, [user?.unitId, selectedUnitId]);

  // 시작일 변경 시 종료일 보정 (시작일 이후 & 최대 14일)
  useEffect(() => {
    if (endDate < startDate) {
      setEndDate(startDate);
    }
    const maxEnd = formatDate(addDays(parseDate(startDate), maxDays - 1));
    if (endDate > maxEnd) {
      setEndDate(maxEnd);
    }
  }, [startDate, endDate]);

  // 부대 + 날짜 범위 변경 시 기존 식단 확인
  useEffect(() => {
    if (!selectedUnitId || step !== 'select') return;

    const checkExisting = async () => {
      setIsCheckingExisting(true);
      try {
        const events = await routineEventApi.getEvents({
          startDate,
          endDate,
          type: 'meal',
        });
        setExistingMealDates(new Set(events.map((e) => e.date)));
      } catch {
        setExistingMealDates(new Set());
      } finally {
        setIsCheckingExisting(false);
      }
    };

    checkExisting();
  }, [step, startDate, endDate, selectedUnitId]);

  // 부대 목록
  const activeUnits = UNITS.filter((u) => u.isActive);
  const filteredUnits = unitSearchQuery
    ? activeUnits.filter((u) => u.name.includes(unitSearchQuery))
    : activeUnits;
  const selectedUnit = UNITS.find((u) => u.id === selectedUnitId);

  // 날짜 관련 계산
  // endDate를 렌더 시점에 클램핑 → startDate 변경 직후 useEffect 보정 전 깜빡임 방지
  const maxEnd = formatDate(addDays(parseDate(startDate), maxDays - 1));
  const effectiveEndDate =
    endDate < startDate ? startDate :
    endDate > maxEnd    ? maxEnd    :
    endDate;
  const allDates = getDateRange(startDate, effectiveEndDate);
  const newDates = allDates.filter((d) => !existingMealDates.has(d));
  const isRangeValid =
    startDate <= effectiveEndDate &&
    startDate >= today &&
    allDates.length <= maxDays;

  // 진행률
  const totalTargetDates = newDates.length;
  const completedCount = Array.from(dayStatuses.values()).filter(
    (s) => s === 'saved' || s === 'skipped' || s === 'error' || s === 'fetched',
  ).length;
  const progress =
    totalTargetDates > 0
      ? Math.round((completedCount / totalTargetDates) * 100)
      : 0;

  // ── 불러오기 시작 ──
  const handleStartImport = async () => {
    if (newDates.length === 0) return;

    setStep('importing');
    setIsImporting(true);
    setImportDone(false);
    abortRef.current = false;

    // 초기 상태 설정
    const initialStatuses = new Map<string, DayImportStatus>();
    newDates.forEach((d) => initialStatuses.set(d, 'pending'));
    setDayStatuses(new Map(initialStatuses));

    // 1. 날짜별 순차 fetch
    const { menus, failedDates: fetchFailed } =
      await unitMealApi.fetchBatchMenus(
        selectedUnitId,
        newDates,
        (fetchDate, status) => {
          if (abortRef.current) return;
          setDayStatuses((prev) => {
            const next = new Map(prev);
            next.set(
              fetchDate,
              status === 'fetching'
                ? 'fetching'
                : status === 'fetched'
                  ? 'fetched'
                  : 'error',
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

    // 2. 전체 saving 상태
    setDayStatuses((prev) => {
      const next = new Map(prev);
      menus.forEach((m) => {
        if (next.get(m.date) === 'fetched') {
          next.set(m.date, 'saving');
        }
      });
      return next;
    });

    // 3. 배치 저장
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
              if (createdDates.has(m.date)) {
                next.set(m.date, 'saved');
              } else if (serverSkipped.includes(m.date)) {
                next.set(m.date, 'skipped');
              }
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
              if (next.get(m.date) === 'saving') {
                next.set(m.date, 'error');
              }
            });
            return next;
          });
          setImportDone(true);
          setIsImporting(false);
        },
      },
    );
  };

  // ── 닫기 & 상태 리셋 ──
  const handleClose = () => {
    if (isImporting) return;
    abortRef.current = true;
    onClose();
    setStep('select');
    setShowUnitPicker(false);
    setUnitSearchQuery('');
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    setStartDate(anchorDate);
    setEndDate(formatDate(addDays(parseDate(anchorDate), 6)));
    setExistingMealDates(new Set());
    setDayStatuses(new Map());
    setIsImporting(false);
    setImportDone(false);
    setSavedCount(0);
    setSkippedDates([]);
    setFailedDates([]);
  };

  const handleDone = () => {
    handleClose();
    if (savedCount > 0) {
      onCreated?.();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="부대 식단 불러오기"
      position="bottom"
      height="full"
      showCloseButton={!isImporting}
      stickyFooter={
        <GradientFooter variant="sheet">
          {step === 'select' && (
            <Button
              variant="primary"
              fullWidth
              onClick={handleStartImport}
              disabled={
                !selectedUnitId ||
                newDates.length === 0 ||
                !isRangeValid ||
                isCheckingExisting
              }
              isLoading={isCheckingExisting}
              className="shadow-none hover:shadow-none"
            >
              {isCheckingExisting
                ? '확인 중...'
                : !selectedUnitId
                  ? '부대를 선택해주세요'
                  : newDates.length === 0
                    ? '불러올 날짜가 없어요'
                    : `${newDates.length}일분 식단 불러오기`}
            </Button>
          )}

          {step === 'importing' && (
            <Button
              variant="primary"
              fullWidth
              onClick={handleDone}
              disabled={!importDone}
              isLoading={isImporting}
              className="shadow-none hover:shadow-none"
            >
              {isImporting ? '불러오는 중...' : '확인'}
            </Button>
          )}
        </GradientFooter>
      }
    >
      <ModalBody className="p-4 space-y-5">
        {/* ================================================ */}
        {/* Step 1: 부대 선택 + 날짜 범위 (병합)              */}
        {/* ================================================ */}
        {step === 'select' && (
          <>
            {/* 부대 선택 */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">부대</h3>
              {selectedUnit ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover">
                  <BuildingsIcon
                    size={20}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm font-medium flex-1">
                    {selectedUnit.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-hover">
                  <BuildingsIcon
                    size={20}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm text-muted-foreground flex-1">
                    부대를 선택해주세요
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowUnitPicker((prev) => !prev)}
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                {showUnitPicker ? (
                  <>
                    <CaretUpIcon size={12} weight="bold" />
                    접기
                  </>
                ) : (
                  <>
                    <CaretDownIcon size={12} weight="bold" />
                    다른 부대 선택
                  </>
                )}
              </button>

              {showUnitPicker && (
                <div className="space-y-2">
                  <div className="relative">
                    <MagnifyingGlassIcon
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      value={unitSearchQuery}
                      onChange={(e) => setUnitSearchQuery(e.target.value)}
                      placeholder="부대명 검색..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-muted text-sm placeholder:text-hint focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-edge-subtle divide-y divide-edge-faint">
                    {filteredUnits.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground text-center">
                        검색 결과 없음
                      </p>
                    ) : (
                      filteredUnits.map((unit) => (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => {
                            setSelectedUnitId(unit.id);
                            setShowUnitPicker(false);
                            setUnitSearchQuery('');
                          }}
                          className={`w-full px-3 py-2.5 text-left text-sm ${
                            unit.id === selectedUnitId
                              ? 'bg-surface-accent text-primary font-medium'
                              : 'text-foreground'
                          }`}
                        >
                          {unit.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 날짜 범위 (탭-확장 피커) */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">불러올 기간</h3>

              {/* 시작일 */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">시작일</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowStartDatePicker((prev) => !prev);
                    setShowEndDatePicker(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-secondary"
                >
                  <CalendarIcon
                    size={18}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm font-medium flex-1 text-left">
                    {formatKoreanDate(startDate, {
                      year: false,
                      weekday: true,
                      weekdayFormat: 'short',
                    })}
                  </span>
                  {showStartDatePicker ? (
                    <CaretUpIcon
                      size={14}
                      className="text-muted-foreground"
                    />
                  ) : (
                    <CaretDownIcon
                      size={14}
                      className="text-muted-foreground"
                    />
                  )}
                </button>
                {showStartDatePicker && (
                  <div className="bg-surface-secondary rounded-xl px-3 py-2">
                    <DatePicker
                      value={startDate}
                      onChange={setStartDate}
                      minDate={today}
                      showLabels={false}
                    />
                  </div>
                )}
              </div>

              {/* 구분선 */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-edge-subtle" />
                <span className="text-xs text-muted-foreground">~</span>
                <div className="flex-1 h-px bg-edge-subtle" />
              </div>

              {/* 종료일 */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">종료일</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowEndDatePicker((prev) => !prev);
                    setShowStartDatePicker(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-secondary"
                >
                  <CalendarIcon
                    size={18}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm font-medium flex-1 text-left">
                    {formatKoreanDate(endDate, {
                      year: false,
                      weekday: true,
                      weekdayFormat: 'short',
                    })}
                  </span>
                  {showEndDatePicker ? (
                    <CaretUpIcon
                      size={14}
                      className="text-muted-foreground"
                    />
                  ) : (
                    <CaretDownIcon
                      size={14}
                      className="text-muted-foreground"
                    />
                  )}
                </button>
                {showEndDatePicker && (
                  <div className="bg-surface-secondary rounded-xl px-3 py-2">
                    <DatePicker
                      value={endDate}
                      onChange={setEndDate}
                      minDate={startDate}
                      maxDate={formatDate(
                        addDays(parseDate(startDate), maxDays - 1),
                      )}
                      showLabels={false}
                    />
                  </div>
                )}
              </div>

            </div>

            {/* 날짜 목록 */}
            {selectedUnitId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    날짜 목록 ({allDates.length}일)
                  </h3>
                  {isCheckingExisting && (
                    <LoadingSpinner size="sm" variant="muted" />
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {allDates.map((d) => {
                    const isExisting = existingMealDates.has(d);
                    return (
                      <div
                        key={d}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                          isExisting ? 'bg-surface-secondary' : 'bg-surface-secondary'
                        }`}
                      >
                        <CalendarIcon
                          size={16}
                          className={
                            isExisting
                              ? 'text-hint-faint'
                              : 'text-foreground'
                          }
                        />
                        <span
                          className={`text-sm flex-1 ${
                            isExisting
                              ? 'text-hint line-through'
                              : 'text-foreground'
                          }`}
                        >
                          {formatKoreanDate(d, {
                            year: false,
                            weekday: true,
                            weekdayFormat: 'short',
                          })}
                        </span>
                        {isExisting && (
                          <span className="text-xs bg-surface-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            등록됨
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {existingMealDates.size > 0 && newDates.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    기존 식단이 있는 날은 건너뜁니다
                  </p>
                )}

                {newDates.length === 0 && !isCheckingExisting && (
                  <p className="text-xs text-yellow-500">
                    선택한 기간에 이미 모든 식단이 등록되어 있어요
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* ================================================ */}
        {/* Step 2: 불러오기 진행                               */}
        {/* ================================================ */}
        {step === 'importing' && (
          <>
            {/* 헤더 */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BuildingsIcon size={18} className="text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {selectedUnit?.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatKoreanDate(startDate, { year: false })} ~{' '}
                {formatKoreanDate(endDate, { year: false })}
              </p>
            </div>

            {/* 프로그레스 바 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {importDone
                    ? '완료'
                    : isImporting
                      ? '불러오는 중...'
                      : '준비 중...'}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 날짜별 진행 리스트 */}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {Array.from(dayStatuses.entries()).map(([d, status]) => (
                <div
                  key={d}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                >
                  <StatusIcon status={status} />
                  <span className="text-sm flex-1">
                    {formatKoreanDate(d, {
                      year: false,
                      weekday: true,
                      weekdayFormat: 'short',
                    })}
                  </span>
                  <StatusLabel status={status} />
                </div>
              ))}
            </div>

            {/* 완료 결과 */}
            {importDone && (
              <div className="bg-surface-secondary rounded-xl p-4 space-y-2">
                {savedCount > 0 ? (
                  <p className="text-sm font-medium text-green-600">
                    {savedCount}일분 식단이 등록되었어요!
                  </p>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">
                    등록된 식단이 없어요
                  </p>
                )}

                {skippedDates.length > 0 && (
                  <p className="text-xs text-yellow-500">
                    이미 등록된 날짜 {skippedDates.length}일 건너뜀
                  </p>
                )}
                {failedDates.length > 0 && (
                  <p className="text-xs text-red-500">
                    조회 실패 {failedDates.length}일:{' '}
                    {failedDates
                      .map((d) => getDayOfWeek(d))
                      .join(', ')}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </ModalBody>
    </Modal>
  );
}
