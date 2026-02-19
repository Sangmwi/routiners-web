'use client';

import { useRouter } from 'next/navigation';
import EmptyState from '@/components/common/EmptyState';
import { useShowError } from '@/lib/stores/errorStore';
import {
  MealCard,
  NutritionSummary,
  EventStatusBadge,
  EventActionButtons,
} from '@/components/routine';
import {
  useRoutineEventByDateSuspense,
  useCompleteRoutineEvent,
  useSkipRoutineEvent,
  useDeleteRoutineEvent,
} from '@/hooks/routine';
import { CalendarIcon, PlusIcon, RobotIcon, TrashIcon } from '@phosphor-icons/react';
import { getEventConfig } from '@/lib/config/theme';
import { isMealData } from '@/lib/types/guards';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import AddMealSheet from '@/components/routine/sheets/AddMealSheet';

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
 * - useSuspenseQuery로 식단 이벤트 조회
 * - 상위 page.tsx의 DetailLayout에서 Header + Suspense 처리
 */
export default function MealContent({ date, onHeaderAction }: MealContentProps) {
  const router = useRouter();
  const showError = useShowError();
  const confirm = useConfirmDialog();

  // Suspense 버전 - { data } 구조분해 (null 가능)
  const { data: event } = useRoutineEventByDateSuspense(date, 'meal');

  // 완료/건너뛰기 뮤테이션
  const completeEvent = useCompleteRoutineEvent();
  const skipEvent = useSkipRoutineEvent();
  const deleteEvent = useDeleteRoutineEvent();

  // 날짜 포맷 & 이벤트 설정
  const formattedDate = formatKoreanDate(date, { weekday: true });
  const eventConfig = getEventConfig('meal');

  // 삭제 핸들러 (ref로 최신 클로저 유지)
  const handleDeleteRef = useRef(() => {});
  handleDeleteRef.current = () => {
    if (!event) return;
    confirm({
      title: '루틴을 삭제하시겠어요?',
      message: '삭제하면 되돌릴 수 없어요.',
      confirmText: '삭제',
      onConfirm: async () => {
        await deleteEvent.mutateAsync({ id: event.id, date: event.date, type: event.type });
        router.back();
      },
    });
  };

  // 헤더 삭제 아이콘
  useEffect(() => {
    if (!onHeaderAction) return;
    if (event) {
      onHeaderAction(
        <button
          onClick={() => handleDeleteRef.current()}
          className="p-1 text-muted-foreground"
          aria-label="삭제"
        >
          <TrashIcon size={20} />
        </button>
      );
    } else {
      onHeaderAction(null);
    }
  }, [event?.id, onHeaderAction]);

  // 완료 처리
  const handleComplete = () => {
    if (!event) return;
    completeEvent.mutate(event.id, {
      onError: () => showError('식단 완료에 실패했어요'),
    });
  };

  // 건너뛰기 처리
  const handleSkip = () => {
    if (!event) return;
    skipEvent.mutate(event.id, {
      onError: () => showError('식단 스킵에 실패했어요'),
    });
  };

  // 직접 추가 바텀시트
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  // 이벤트 없음 (예정된 식단 없음)
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
          <div className="flex flex-col gap-3 mt-6 px-4">
            <button
              onClick={() => router.push('/routine/coach')}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-primary text-primary-foreground"
            >
              <RobotIcon size={18} />
              AI 추천받기
            </button>
            <button
              onClick={() => setIsAddSheetOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-muted/50 text-muted-foreground"
            >
              <PlusIcon size={18} weight="bold" />
              식단 직접 입력
            </button>
          </div>
        </div>
        <AddMealSheet
          isOpen={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          date={date}
        />
      </>
    );
  }

  // 식단 데이터 확인
  const mealData = isMealData(event.data) ? event.data : null;

  return (
    <>
      <div className="space-y-8">
        {/* 헤더 섹션 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            <EventStatusBadge status={event.status} />
          </div>

          <div className="flex items-center gap-3">
            <eventConfig.icon size={28} className={eventConfig.color} weight="fill" />
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{event.title}</h1>
              {event.rationale && (
                <p className="text-sm text-muted-foreground mt-1">
                  {event.rationale}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 영양소 요약 */}
        {mealData && <NutritionSummary data={mealData} />}

        {/* 식사 목록 */}
        {mealData && mealData.meals.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              식사 목록 ({mealData.meals.length}끼)
            </h2>
            <div className="space-y-3">
              {mealData.meals.map((meal, index) => (
                <MealCard
                  key={`${meal.type}-${index}`}
                  meal={meal}
                  isCompleted={event.status === 'completed'}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-xl p-6 text-center">
            <p className="text-muted-foreground">상세 식단 정보가 없어요.</p>
          </div>
        )}

        {/* 추가 정보 */}
        {mealData?.notes && (
          <div className="bg-muted/20 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              메모
            </h3>
            <p className="text-foreground">{mealData.notes}</p>
          </div>
        )}
      </div>

      {/* 하단 액션 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-safe bg-background border-t border-border">
        <EventActionButtons
          status={event.status}
          onComplete={handleComplete}
          onSkip={handleSkip}
          isLoading={completeEvent.isPending || skipEvent.isPending}
        />
      </div>
    </>
  );
}
