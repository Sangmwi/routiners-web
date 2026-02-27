'use client';

import { BarbellIcon, RobotIcon } from '@phosphor-icons/react';
import RoutineOptionSheet, {
  type RoutineOptionItem,
} from '@/components/routine/common/RoutineOptionSheet';

export type WorkoutAddOption = 'ai' | 'direct';

interface WorkoutAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: WorkoutAddOption) => void;
}

const OPTIONS: RoutineOptionItem<WorkoutAddOption>[] = [
  {
    value: 'ai',
    title: 'AI 상담사에게 맡기기',
    description: '맞춤 루틴 자동 생성',
    icon: <RobotIcon size={18} />,
    primary: true,
  },
  {
    value: 'direct',
    title: '운동 직접 추가',
    icon: <BarbellIcon size={18} weight="fill" />,
  },
];

export default function WorkoutAddSheet({
  isOpen,
  onClose,
  onSelect,
}: WorkoutAddSheetProps) {
  return (
    <RoutineOptionSheet
      isOpen={isOpen}
      onClose={onClose}
      title="운동 추가하기"
      options={OPTIONS}
      onSelect={onSelect}
    />
  );
}
