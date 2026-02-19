'use client';

import { BarbellIcon, ChartBarIcon, LightningIcon, ShoppingCartIcon, type Icon } from '@phosphor-icons/react';
import type { ActionChip } from '@/lib/types/coach';

interface ActionChipsProps {
  /** 칩 클릭 핸들러 */
  onChipClick: (chip: ActionChip) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

/**
 * 기본 액션 칩 목록
 */
const DEFAULT_ACTION_CHIPS: ActionChip[] = [
  {
    id: 'routine_generation',
    icon: 'Barbell',
    label: '운동 루틴 생성',
    description: '맞춤 운동 루틴을 만들어 드려요',
    triggersPurpose: 'routine_generation',
  },
  {
    id: 'quick_routine',
    icon: 'Lightning',
    label: '오늘의 운동',
    description: '빠르게 오늘 운동을 만들어요',
    triggersPurpose: 'quick_routine',
  },
  // 추후 확장:
  // {
  //   id: 'nutrition_analysis',
  //   icon: 'ChartBar',
  //   label: '영양 분석',
  //   description: '현재 영양 상태를 분석해 드려요',
  // },
  // {
  //   id: 'px_browse',
  //   icon: 'ShoppingCart',
  //   label: 'PX 둘러보기',
  //   description: 'PX 추천 상품을 확인해요',
  //   action: '/px',
  // },
];

/**
 * 아이콘 이름 → 컴포넌트 매핑
 */
const ICON_MAP: Record<string, Icon> = {
  Barbell: BarbellIcon,
  Lightning: LightningIcon,
  ChartBar: ChartBarIcon,
  ShoppingCart: ShoppingCartIcon,
};

/**
 * 액션 칩 컴포넌트
 *
 * Grok 스타일 - ChatInput 바로 위에 가로 스크롤로 표시
 * - 대화 시작 전 또는 activePurpose 없을 때 표시
 */
export default function ActionChips({
  onChipClick,
  disabled = false,
}: ActionChipsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto px-4 py-3 border-t border-border scrollbar-hide">
      {DEFAULT_ACTION_CHIPS.map((chip) => {
        const Icon = ICON_MAP[chip.icon] || BarbellIcon;

        return (
          <button
            key={chip.id}
            onClick={() => onChipClick(chip)}
            disabled={disabled}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-muted/50 active:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon size={18} weight="fill" className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">
                {chip.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {chip.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
