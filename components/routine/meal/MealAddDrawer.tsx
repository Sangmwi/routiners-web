'use client';

import Modal, { ModalBody } from '@/components/ui/Modal';
import { BuildingsIcon, PlusIcon, RobotIcon, XIcon } from '@phosphor-icons/react';

// ============================================================================
// Types
// ============================================================================

export type MealAddOption = 'import' | 'ai' | 'direct';

interface MealAddDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: MealAddOption) => void;
  /** 이미 이벤트가 있는 상세 페이지에서 열릴 때 ("식사 추가" 타이틀 사용) */
  isAppending?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * 식단 추가 방법 선택 드로어
 *
 * 옵션 순서:
 * 1. 부대 식단 불러오기 (primary) — 대부분의 날
 * 2. AI 식단 추천 — 외출/외박/부대 식단 없는 날
 * 3. 직접 입력
 *
 * EmptyTodayCard, DayEventSection, MealContent 빈 상태 공유
 */
export default function MealAddDrawer({
  isOpen,
  onClose,
  onSelect,
  isAppending = false,
}: MealAddDrawerProps) {
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
            {isAppending ? '식사 추가' : '식단 추가하기'}
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
          {/* 1순위: 부대 식단 불러오기 */}
          <button
            type="button"
            onClick={() => onSelect('import')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            <BuildingsIcon size={18} />
            <div className="text-left">
              <p className="text-sm font-medium">부대 식단 불러오기</p>
            </div>
          </button>

          {/* 2순위: AI 식단 추천 */}
          <button
            type="button"
            onClick={() => onSelect('ai')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-muted/50 text-foreground font-medium"
          >
            <RobotIcon size={18} className="text-muted-foreground shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium">AI 식단 추천</p>
              <p className="text-xs text-muted-foreground mt-0.5">외출·외박·부대식단 없는 날</p>
            </div>
          </button>

          {/* 3순위: 직접 입력 */}
          <button
            type="button"
            onClick={() => onSelect('direct')}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-muted/50 text-foreground font-medium"
          >
            <PlusIcon size={18} weight="bold" className="text-muted-foreground shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium">직접 입력</p>
            </div>
          </button>
        </div>
      </ModalBody>
    </Modal>
  );
}
