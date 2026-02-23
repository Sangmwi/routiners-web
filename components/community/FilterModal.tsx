'use client';

import Modal, { ModalBody } from '@/components/ui/Modal';
import ChipButton from '@/components/ui/ChipButton';

export type DateRange = 'all' | 'today' | 'week' | 'month';

const DATE_RANGE_OPTIONS: { id: DateRange; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'today', label: '오늘' },
  { id: 'week', label: '이번 주' },
  { id: 'month', label: '이번 달' },
];

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange: DateRange;
  onApply: (dateRange: DateRange) => void;
}

export default function FilterModal({
  isOpen,
  onClose,
  dateRange,
  onApply,
}: FilterModalProps) {
  const handleSelect = (range: DateRange) => {
    onApply(range);
    onClose();
  };

  const handleReset = () => {
    onApply('all');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="필터"
      headerAction={
        <button
          onClick={handleReset}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          초기화
        </button>
      }
      position="bottom"
      enableSwipe
      showCloseButton={false}
    >
      <ModalBody className="px-5 pt-4 pb-6 pb-safe">
        <div className="space-y-6">
          {/* 기간 필터 */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              기간
            </span>
            <div className="flex flex-wrap gap-2">
              {DATE_RANGE_OPTIONS.map((option) => (
                <ChipButton
                  key={option.id}
                  selected={dateRange === option.id}
                  onClick={() => handleSelect(option.id)}
                >
                  {option.label}
                </ChipButton>
              ))}
            </div>
          </div>

          {/* 정렬 */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              정렬
            </span>
            <div className="flex flex-wrap gap-2">
              <ChipButton selected>
                최신순
              </ChipButton>
              <ChipButton selected={false} disabled>
                인기순
              </ChipButton>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
