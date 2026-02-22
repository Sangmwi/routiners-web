import { BarbellIcon, ForkKnifeIcon, type Icon } from '@phosphor-icons/react';
import type { ActionChip } from '@/lib/types/counselor';

/**
 * 기본 액션 칩 목록
 *
 * triggerMessage: AI에게 메시지만 전송 → AI가 상태 확인 후 적절한 프로세스 라우팅
 */
export const DEFAULT_ACTION_CHIPS: ActionChip[] = [
  {
    id: 'workout_counseling',
    icon: 'Barbell',
    label: '운동 상담',
    description: '운동 루틴을 만들거나 수정해요',
    triggerMessage: '운동에 대해 상담하고 싶어요',
  },
  {
    id: 'diet_counseling',
    icon: 'ForkKnife',
    label: '식단 상담',
    description: '맞춤 식단을 만들어 드려요',
    triggerMessage: '식단에 대해 상담하고 싶어요',
  },
];

/**
 * 아이콘 이름 → 컴포넌트 매핑
 */
export const ICON_MAP: Record<string, Icon> = {
  Barbell: BarbellIcon,
  ForkKnife: ForkKnifeIcon,
};
