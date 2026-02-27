'use client';

import { BuildingsIcon, PlusIcon, RobotIcon } from '@phosphor-icons/react';
import RoutineOptionSheet, {
  type RoutineOptionItem,
} from '@/components/routine/common/RoutineOptionSheet';

export type MealAddOption = 'import' | 'ai' | 'direct';

interface MealAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: MealAddOption) => void;
  isAppending?: boolean;
}

const DEFAULT_OPTIONS: RoutineOptionItem<MealAddOption>[] = [
  {
    value: 'import',
    title: '부대 식단 불러오기',
    icon: <BuildingsIcon size={18} />,
    primary: true,
  },
  {
    value: 'ai',
    title: 'AI 식단 추천',
    description: '외출·외박·부대식단 없는 날',
    icon: <RobotIcon size={18} />,
  },
  {
    value: 'direct',
    title: '직접 입력',
    icon: <PlusIcon size={18} weight="bold" />,
  },
];

export default function MealAddSheet({
  isOpen,
  onClose,
  onSelect,
  isAppending = false,
}: MealAddSheetProps) {
  return (
    <RoutineOptionSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isAppending ? '식사 추가' : '식단 추가하기'}
      options={DEFAULT_OPTIONS}
      onSelect={onSelect}
    />
  );
}
