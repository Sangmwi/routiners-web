'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DayEventCard } from '@/components/routine';
import { useRoutineEventByDateSuspense, useDeleteRoutineEvent } from '@/hooks/routine';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import type { EventType } from '@/lib/types/routine';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import { BarbellIcon, ForkKnifeIcon, RobotIcon, PlusIcon } from '@phosphor-icons/react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import AddWorkoutSheet from '@/components/routine/sheets/AddWorkoutSheet';
import AddMealSheet from '@/components/routine/sheets/AddMealSheet';

type FilterType = EventType | 'all';

interface DayEventSectionProps {
  date: string;
  filterType: FilterType;
}

/**
 * 선택된 날짜의 이벤트 섹션 (Suspense 내부)
 *
 * - 운동/식단 독립 섹션으로 표시
 * - 없는 타입에만 AI/직접 추가 드로어 노출
 * - 날짜/필터 변경 시 이 영역만 로딩
 */
export default function DayEventSection({ date, filterType }: DayEventSectionProps) {
  const router = useRouter();

  // Suspense 쿼리: 선택된 날짜의 이벤트들
  const { data: workoutEvent } = useRoutineEventByDateSuspense(date, 'workout');
  const { data: mealEvent } = useRoutineEventByDateSuspense(date, 'meal');

  // 삭제
  const deleteEvent = useDeleteRoutineEvent();
  const confirm = useConfirmDialog();

  const handleDelete = (eventId: string) => {
    const targetEvent = workoutEvent?.id === eventId ? workoutEvent : mealEvent;
    confirm({
      title: '루틴을 삭제하시겠어요?',
      message: '삭제하면 되돌릴 수 없어요.',
      confirmText: '삭제',
      onConfirm: async () => {
        await deleteEvent.mutateAsync({
          id: eventId,
          date: targetEvent?.date ?? date,
          type: targetEvent?.type ?? 'workout',
        });
      },
    });
  };

  // AI/직접 추가 드로어
  const [drawerType, setDrawerType] = useState<'workout' | 'meal' | null>(null);
  // 직접 추가 시트
  const [activeSheet, setActiveSheet] = useState<'workout' | 'meal' | null>(null);

  const handleAI = () => {
    setDrawerType(null);
    router.push('/routine/coach');
  };

  const handleManual = (type: 'workout' | 'meal') => {
    setDrawerType(null);
    setActiveSheet(type);
  };

  const handleCreated = (type: 'workout' | 'meal') => {
    router.push(`/routine/${type}/${date}`);
  };

  const showWorkout = filterType === 'all' || filterType === 'workout';
  const showMeal = filterType === 'all' || filterType === 'meal';

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        {formatKoreanDate(date, {
          year: false,
          weekday: true,
          weekdayFormat: 'short',
        })}{' '}
        루틴
      </h2>

      <div>
        {showWorkout && (
          workoutEvent ? (
            <DayEventCard event={workoutEvent} date={date} onDelete={handleDelete} />
          ) : (
            <button
              type="button"
              onClick={() => setDrawerType('workout')}
              className="w-full flex items-center gap-4 px-2 py-5 active:bg-muted/20 transition-colors rounded-xl"
            >
              <BarbellIcon size={28} weight="duotone" className="text-muted-foreground/50 shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-muted-foreground">예정된 운동이 없어요</p>
              </div>
              <div className="flex items-center gap-1 text-primary shrink-0">
                <PlusIcon size={16} weight="bold" />
                <span className="text-sm font-medium">추가</span>
              </div>
            </button>
          )
        )}

        {showWorkout && showMeal && (
          <div className="mx-2 border-t border-border/40" />
        )}

        {showMeal && (
          mealEvent ? (
            <DayEventCard event={mealEvent} date={date} onDelete={handleDelete} />
          ) : (
            <button
              type="button"
              onClick={() => setDrawerType('meal')}
              className="w-full flex items-center gap-4 px-2 py-5 active:bg-muted/20 transition-colors rounded-xl"
            >
              <ForkKnifeIcon size={28} weight="duotone" className="text-muted-foreground/50 shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-muted-foreground">예정된 식단이 없어요</p>
              </div>
              <div className="flex items-center gap-1 text-primary shrink-0">
                <PlusIcon size={16} weight="bold" />
                <span className="text-sm font-medium">추가</span>
              </div>
            </button>
          )
        )}
      </div>

      {/* AI / 직접 추가 선택 드로어 */}
      <Modal
        isOpen={!!drawerType}
        onClose={() => setDrawerType(null)}
        position="bottom"
        enableSwipe
        height="auto"
        showCloseButton={false}
      >
        <ModalBody className="p-4 pb-safe space-y-3">
          <button
            type="button"
            onClick={handleAI}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-primary text-primary-foreground"
          >
            <RobotIcon size={18} />
            AI 상담에게 맡기기
          </button>
          <button
            type="button"
            onClick={() => drawerType && handleManual(drawerType)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-muted/50 text-muted-foreground"
          >
            <PlusIcon size={18} weight="bold" />
            {drawerType === 'meal' ? '식단 직접 입력' : '운동 직접 추가'}
          </button>
        </ModalBody>
      </Modal>

      {/* 등록 바텀시트 */}
      <AddWorkoutSheet
        isOpen={activeSheet === 'workout'}
        onClose={() => setActiveSheet(null)}
        date={date}
        onCreated={() => handleCreated('workout')}
      />
      <AddMealSheet
        isOpen={activeSheet === 'meal'}
        onClose={() => setActiveSheet(null)}
        date={date}
        onCreated={() => handleCreated('meal')}
      />
    </div>
  );
}
