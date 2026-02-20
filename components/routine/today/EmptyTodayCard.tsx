'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarbellIcon, ForkKnifeIcon, CaretRightIcon, RobotIcon, PlusIcon } from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils/dateHelpers';
import Modal, { ModalBody } from '@/components/ui/Modal';
import AddWorkoutSheet from '@/components/routine/sheets/AddWorkoutSheet';
import AddMealSheet from '@/components/routine/sheets/AddMealSheet';

interface EmptyTodayCardProps {
  type: 'workout' | 'meal';
}

const CONFIG = {
  workout: {
    icon: BarbellIcon,
    title: '오늘 운동 없음',
    subtitle: '기록을 추가해보세요',
    aiLabel: 'AI 상담에게 맡기기',
    addLabel: '운동 직접 추가',
  },
  meal: {
    icon: ForkKnifeIcon,
    title: '오늘 식단 없음',
    subtitle: '식단을 기록해보세요',
    aiLabel: 'AI 추천받기',
    addLabel: '식단 직접 입력',
  },
} as const;

/**
 * 빈 상태 표시
 * - 탭하면 AI/직접 추가 선택 드로어 열림
 * - TodayEventCard와 일관된 스타일
 */
export function EmptyTodayCard({ type }: EmptyTodayCardProps) {
  const router = useRouter();
  const today = formatDate(new Date());
  const { icon: Icon, title, subtitle, aiLabel, addLabel } = CONFIG[type];

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleAI = () => {
    setIsDrawerOpen(false);
    router.push('/routine/counselor');
  };

  const handleManual = () => {
    setIsDrawerOpen(false);
    setIsSheetOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDrawerOpen(true)}
        className="w-full flex items-center gap-4 px-2 py-5 active:bg-muted/20 transition-colors rounded-xl"
      >
        <Icon size={32} weight="duotone" className="text-muted-foreground/60 shrink-0" />
        <div className="flex-1 min-w-0 text-left">
          <h3 className="text-base font-medium text-muted-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground/60 mt-1">{subtitle}</p>
        </div>
        <CaretRightIcon size={20} weight="bold" className="text-muted-foreground/50 shrink-0" />
      </button>

      {/* AI / 직접 추가 선택 드로어 */}
      <Modal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
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
            {aiLabel}
          </button>
          <button
            type="button"
            onClick={handleManual}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-medium bg-muted/50 text-muted-foreground"
          >
            <PlusIcon size={18} weight="bold" />
            {addLabel}
          </button>
        </ModalBody>
      </Modal>

      {/* 직접 추가 시트 */}
      {type === 'workout' ? (
        <AddWorkoutSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          date={today}
          onCreated={() => router.push(`/routine/workout/${today}`)}
        />
      ) : (
        <AddMealSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          date={today}
          onCreated={() => router.push(`/routine/meal/${today}`)}
        />
      )}
    </>
  );
}

export default EmptyTodayCard;
