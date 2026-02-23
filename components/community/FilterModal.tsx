'use client';

import Modal, { ModalBody } from '@/components/ui/Modal';

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
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                    dateRange === option.id
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 정렬 */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              정렬
            </span>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full px-3.5 py-1.5 text-xs font-medium bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                최신순
              </button>
              <button
                className="rounded-full px-3.5 py-1.5 text-xs font-medium bg-muted/20 text-muted-foreground/40 cursor-not-allowed"
                disabled
              >
                인기순
              </button>
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
