'use client';

import Modal, { ModalBody } from '@/components/ui/Modal';
import { BarbellIcon, PlusIcon, RobotIcon, XIcon } from '@phosphor-icons/react';

// ============================================================================
// Types
// ============================================================================

export type WorkoutAddOption = 'ai' | 'direct';

interface WorkoutAddDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: WorkoutAddOption) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * 운동 추가 방법 선택 드로어
 *
 * 옵션 순서:
 * 1. AI 상담에게 맡기기 (primary)
 * 2. 운동 직접 추가
 *
 * EmptyTodayCard, DayEventSection 공유
 * MealAddDrawer와 동일한 구조/스타일
 */
export default function WorkoutAddDrawer({
  isOpen,
  onClose,
  onSelect,
}: WorkoutAddDrawerProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      height="auto"
      showCloseButton={false}
    >
      <ModalBody className="p-4 pb-safe">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">
            운동 추가하기
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground"
            aria-label="닫기"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {/* 1순위: AI 상담 */}
          <button
            type="button"
            onClick={() => onSelect('ai')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            <RobotIcon size={18} className="shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium">AI 상담에게 맡기기</p>
              <p className="text-xs text-primary-foreground/70 mt-0.5">맞춤 루틴 생성</p>
            </div>
          </button>

          {/* 2순위: 직접 추가 */}
          <button
            type="button"
            onClick={() => onSelect('direct')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-muted/50 text-foreground font-medium"
          >
            <BarbellIcon size={18} weight="fill" className="text-muted-foreground shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium">운동 직접 추가</p>
            </div>
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}
