'use client';

import { useRouter } from 'next/navigation';
import EmptyState from '@/components/common/EmptyState';
import {
  MealCard,
  NutritionSummary,
  EventStatusBadge,
  EventActionButtons,
} from '@/components/routine';
import { useMealEvent } from '@/hooks/routine';
import { CalendarIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { getEventConfig } from '@/lib/config/theme';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import AddMealSheet from '@/components/routine/sheets/AddMealSheet';
import ImportUnitMealSheet from '@/components/routine/sheets/ImportUnitMealSheet';
import MealAddDrawer, { type MealAddOption } from '@/components/routine/meal/MealAddDrawer';

// ============================================================
// Content Component (Suspense 내부)
// ============================================================

interface MealContentProps {
  date: string;
  onHeaderAction?: (action: ReactNode) => void;
}

/**
 * 식단 상세 콘텐츠 (Suspense 내부)
 *
 * - useMealEvent 훅으로 비즈니스 로직 분리
 * - 편집 모드: 개별 끼니 삭제
 * - 단일 "식사 추가" 진입점 → MealAddDrawer (부대 식단 / AI / 직접 입력)
 */
export default function MealContent({ date, onHeaderAction }: MealContentProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();

  const {
    event,
    mealData,
    handleDelete,
    handleComplete,
    handleSkip,
    handleMealToggle,
    handleRemoveMeal,
    isUpdating,
    isCompleting,
    isSkipping,
  } = useMealEvent(date);

  const formattedDate = formatKoreanDate(date, { weekday: true });
  const eventConfig = getEventConfig('meal');

  // ── 편집 모드 ─────────────────────────────────────────────────────────────
  const [isEditMode, setIsEditMode] = useState(false);

  const enterEditMode = () => setIsEditMode(true);
  const exitEditMode = () => setIsEditMode(false);

  // ── 추가 드로어 ───────────────────────────────────────────────────────────
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);

  const handleAddOption = (option: MealAddOption) => {
    setIsAddDrawerOpen(false);
    if (option === 'ai') {
      router.push('/routine/counselor');
    } else if (option === 'direct') {
      setIsAddSheetOpen(true);
    } else {
      setIsImportSheetOpen(true);
    }
  };

  // ── 편집 모드의 끼니 삭제 (confirm) ──────────────────────────────────────
  const handleRemoveMealWithConfirm = (mealIndex: number) => {
    const mealLabel = mealData?.meals[mealIndex]
      ? (['아침', '점심', '저녁', '간식'] as const)[
          ['breakfast', 'lunch', 'dinner', 'snack'].indexOf(mealData.meals[mealIndex].type)
        ] ?? '식사'
      : '식사';

    confirm({
      title: `${mealLabel}을(를) 삭제할까요?`,
      message: '삭제된 식사는 되돌릴 수 없어요.',
      confirmText: '삭제',
      onConfirm: () => handleRemoveMeal(mealIndex),
    });
  };

  // ── 헤더 액션 (ref로 최신 클로저 유지) ────────────────────────────────────
  const enterEditModeRef = useRef(enterEditMode);
  enterEditModeRef.current = enterEditMode;
  const exitEditModeRef = useRef(exitEditMode);
  exitEditModeRef.current = exitEditMode;
  const handleDeleteRef = useRef(handleDelete);
  handleDeleteRef.current = handleDelete;

  useEffect(() => {
    if (!onHeaderAction) return;
    if (!event) {
      onHeaderAction(null);
      return;
    }

    if (isEditMode) {
      onHeaderAction(
        <button
          onClick={() => exitEditModeRef.current()}
          className="px-3 py-1 text-sm font-medium text-primary"
        >
          완료
        </button>
      );
    } else if (event.status === 'scheduled') {
      onHeaderAction(
        <div className="flex items-center gap-1">
          <button
            onClick={() => enterEditModeRef.current()}
            className="p-1 text-muted-foreground"
            aria-label="편집"
          >
            <PencilSimpleIcon size={20} />
          </button>
          <button
            onClick={() => handleDeleteRef.current()}
            className="p-1 text-muted-foreground"
            aria-label="삭제"
          >
            <TrashIcon size={20} />
          </button>
        </div>
      );
    } else {
      onHeaderAction(
        <button
          onClick={() => handleDeleteRef.current()}
          className="p-1 text-muted-foreground"
          aria-label="삭제"
        >
          <TrashIcon size={20} />
        </button>
      );
    }
  }, [event?.id, event?.status, isEditMode, onHeaderAction]);

  // ── 이벤트 없음 ───────────────────────────────────────────────────────────
  if (!event) {
    return (
      <>
        <div className="mt-8">
          <EmptyState
            icon={CalendarIcon}
            message={`${formattedDate}에 예정된 식단이 없어요`}
            showIconBackground
            size="lg"
          />
          <div className="mt-6 px-4">
            <button
              onClick={() => setIsAddDrawerOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-primary text-primary-foreground"
            >
              <PlusIcon size={18} weight="bold" />
              식단 추가하기
            </button>
          </div>
        </div>

        <MealAddDrawer
          isOpen={isAddDrawerOpen}
          onClose={() => setIsAddDrawerOpen(false)}
          onSelect={handleAddOption}
        />
        <AddMealSheet
          isOpen={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          date={date}
        />
        <ImportUnitMealSheet
          isOpen={isImportSheetOpen}
          onClose={() => setIsImportSheetOpen(false)}
          date={date}
        />
      </>
    );
  }

  // ── 이벤트 존재 ───────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-8">
        {/* 헤더 섹션 */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <eventConfig.icon size={18} className={eventConfig.color} weight="fill" />
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
            <EventStatusBadge status={event.status} />
          </div>

          {event.rationale && (
            <p className="text-sm text-muted-foreground mt-2">
              {event.rationale}
            </p>
          )}
        </div>

        {/* 영양소 요약 */}
        {mealData && <NutritionSummary data={mealData} />}

        {/* 식사 목록 */}
        {mealData && mealData.meals.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                식사 목록 ({mealData.meals.length}끼)
              </h2>
              {!isEditMode && event.status === 'scheduled' && mealData.meals.some((m) => m.completed) && (
                <p className="text-xs text-muted-foreground">
                  {mealData.meals.filter((m) => m.completed).length}/{mealData.meals.length}끼 완료
                </p>
              )}
            </div>

            <div className="space-y-3">
              {mealData.meals.map((meal, index) => (
                <MealCard
                  key={`${meal.type}-${index}`}
                  meal={meal}
                  isCompleted={event.status === 'completed'}
                  showCompletionToggle={!isEditMode && event.status === 'scheduled'}
                  onToggleComplete={() => handleMealToggle(index)}
                  showDeleteButton={isEditMode && mealData.meals.length > 1}
                  onDelete={() => handleRemoveMealWithConfirm(index)}
                />
              ))}
            </div>

            {/* 식사 추가 버튼 (scheduled & 편집 모드 아닐 때) */}
            {event.status === 'scheduled' && !isEditMode && (
              <button
                type="button"
                onClick={() => setIsAddDrawerOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground"
              >
                <PlusIcon size={16} weight="bold" />
                식사 추가
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-xl p-6 text-center">
              <p className="text-muted-foreground">상세 식단 정보가 없어요.</p>
            </div>
            {event.status === 'scheduled' && (
              <button
                type="button"
                onClick={() => setIsAddDrawerOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground"
              >
                <PlusIcon size={16} weight="bold" />
                식사 추가
              </button>
            )}
          </div>
        )}

        {/* 메모 */}
        {mealData?.notes && (
          <div className="bg-muted/20 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              메모
            </h3>
            <p className="text-foreground">{mealData.notes}</p>
          </div>
        )}
      </div>

      {/* 하단 액션 버튼 (편집 모드 아닐 때만) */}
      {!isEditMode && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-safe bg-background border-t border-border">
          <EventActionButtons
            status={event.status}
            onComplete={handleComplete}
            onSkip={handleSkip}
            isLoading={isCompleting || isSkipping || isUpdating}
          />
        </div>
      )}

      {/* 식사 추가 드로어 (이벤트 있을 때 = 식사 append 모드) */}
      <MealAddDrawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onSelect={handleAddOption}
        isAppending
      />

      {/* 직접 입력 시트 (update 모드: existingEvent 전달) */}
      <AddMealSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        date={date}
        existingEvent={event}
      />

      {/* 부대 식단 불러오기 */}
      <ImportUnitMealSheet
        isOpen={isImportSheetOpen}
        onClose={() => setIsImportSheetOpen(false)}
        date={date}
      />
    </>
  );
}
