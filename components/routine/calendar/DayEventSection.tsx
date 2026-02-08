'use client';

import { useState } from 'react';
import { DayEventCard } from '@/components/routine';
import { useRoutineEventByDateSuspense } from '@/hooks/routine';
import type { EventType } from '@/lib/types/routine';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import { PlusIcon, BarbellIcon, ForkKnifeIcon } from '@phosphor-icons/react';
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
 * - 독립적인 Suspense 경계로 분리
 * - 날짜/필터 변경 시 이 영역만 로딩
 * - 캘린더 그리드는 영향받지 않음
 */
export default function DayEventSection({ date, filterType }: DayEventSectionProps) {
  // Suspense 쿼리: 선택된 날짜의 이벤트들
  const { data: workoutEvent } = useRoutineEventByDateSuspense(date, 'workout');
  const { data: mealEvent } = useRoutineEventByDateSuspense(date, 'meal');

  // + 버튼 메뉴
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'workout' | 'meal' | null>(null);

  // 필터에 맞는 이벤트 선택
  const selectedEvent =
    filterType === 'workout'
      ? (workoutEvent ?? null)
      : filterType === 'meal'
        ? (mealEvent ?? null)
        : (workoutEvent ?? mealEvent ?? null);

  const handleSelectType = (type: 'workout' | 'meal') => {
    setIsMenuOpen(false);
    setActiveSheet(type);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">
          {formatKoreanDate(date, {
            year: false,
            weekday: true,
            weekdayFormat: 'short',
          })}{' '}
          루틴
        </h2>
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <PlusIcon size={18} weight="bold" />
        </button>
      </div>
      <DayEventCard event={selectedEvent} date={date} />

      {/* 운동/식단 선택 메뉴 */}
      <Modal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title="추가하기"
        position="bottom"
        enableSwipe
        height="auto"
        showCloseButton
      >
        <ModalBody className="space-y-2 pb-safe">
          <button
            type="button"
            onClick={() => handleSelectType('workout')}
            className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/50"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500/10">
              <BarbellIcon size={20} className="text-blue-500" weight="duotone" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">운동 추가</p>
              <p className="text-xs text-muted-foreground">운동 종목과 세트를 직접 입력</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleSelectType('meal')}
            className="w-full flex items-center gap-3 p-3 rounded-xl active:bg-muted/50"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-500/10">
              <ForkKnifeIcon size={20} className="text-green-500" weight="duotone" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">식단 추가</p>
              <p className="text-xs text-muted-foreground">음식과 영양 정보를 직접 입력</p>
            </div>
          </button>
        </ModalBody>
      </Modal>

      {/* 등록 바텀시트 */}
      <AddWorkoutSheet
        isOpen={activeSheet === 'workout'}
        onClose={() => setActiveSheet(null)}
        date={date}
      />
      <AddMealSheet
        isOpen={activeSheet === 'meal'}
        onClose={() => setActiveSheet(null)}
        date={date}
      />
    </div>
  );
}
